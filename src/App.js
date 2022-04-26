import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import NotificationSystem from 'react-notification-system';
import DT from 'duration-time-conversion';
import isEqual from 'lodash/isEqual';
import styled from 'styled-components';
import Tool from './components/Tool';
import Subtitles from './components/Subtitles';
import Player from './components/Player';
import Footer from './components/Footer';
import Loading from './components/Loading';
import ProgressBar from './components/ProgressBar';
import { getKeyCode } from './utils';
import Sub from './libs/Sub';

const Style = styled.div`
    height: 100%;
    width: 100%;

    .main {
        display: flex;
        height: calc(100% - 200px);

        .player {
            flex: 1;
        }

        .subtitles {
            width: 400px;
        }

        .tool {
            width: 300px;
        }
    }

    .footer {
        height: 200px;
    }
`;

export default function App({ defaultLang }) {
    const subtitleHistory = useRef([]);
    const notificationSystem = useRef(null);
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState('');
    const [processing, setProcessing] = useState(0);
    const [language, setLanguage] = useState(defaultLang);
    const [subtitle, setSubtitleOriginal] = useState([]);
    const [waveform, setWaveform] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [translate, setTranslate] = useState('en');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [resumed, setResumed] = useState(false);
    const [viewEng, setViewEng] = useState(true);

    const newSub = useCallback((item) => new Sub(item), []);
    const hasSub = useCallback((sub) => subtitle.indexOf(sub), [subtitle]);

    const formatSub = useCallback(
        (sub) => {
            if (Array.isArray(sub)) {
                return sub.map((item) => newSub(item));
            }
            return newSub(sub);
        },
        [newSub],
    );

    const copySubs = useCallback(() => formatSub(subtitle), [subtitle, formatSub]);

    const setSubtitle = useCallback(
        (newSubtitle, saveToHistory = true) => {
            if (!isEqual(newSubtitle, subtitle)) {
                if (saveToHistory) {
                    if (subtitleHistory.current.length >= 1000) {
                        subtitleHistory.current.shift();
                    }
                    subtitleHistory.current.push(formatSub(subtitle));
                }
                window.localStorage.setItem('subtitle', JSON.stringify(newSubtitle));
                setSubtitleOriginal(newSubtitle);
            }
        },
        [subtitle, setSubtitleOriginal, formatSub],
    );

    const undoSubs = useCallback(() => {
        const subs = subtitleHistory.current.pop();
        if (subs) {
            setSubtitle(subs, false);
        }
    }, [setSubtitle, subtitleHistory]);

    const clearSubs = useCallback(() => {
        setSubtitle([]);
        subtitleHistory.current.length = 0;
    }, [setSubtitle, subtitleHistory]);

    const checkSub = useCallback(
        (sub) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const previous = subtitle[index - 1];
            return (previous && sub.startTime < previous.endTime) || !sub.check || sub.duration < 0.2;
        },
        [subtitle, hasSub],
    );

    const notify = useCallback(
        (obj) => {
            // https://github.com/igorprado/react-notification-system
            const notification = notificationSystem.current;
            notification.clearNotifications();
            notification.addNotification({
                position: 'tc',
                dismissible: 'none',
                autoDismiss: 2,
                message: obj.message,
                level: obj.level,
            });
        },
        [notificationSystem],
    );

    const removeSub = useCallback(
        (sub) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const subs = copySubs();
            subs.splice(index, 1);
            setSubtitle(subs);
        },
        [hasSub, copySubs, setSubtitle],
    );

    const addSub = useCallback(
        (index, sub) => {
            const subs = copySubs();
            subs.splice(index, 0, formatSub(sub));
            setSubtitle(subs);
        },
        [copySubs, setSubtitle, formatSub],
    );

    const updateSub = useCallback(
        (sub, obj) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const subs = copySubs();
            const subClone = formatSub(sub);
            Object.assign(subClone, obj);
            if (subClone.check) {
                subs[index] = subClone;
                setSubtitle(subs);
            }
        },
        [hasSub, copySubs, setSubtitle, formatSub],
    );

    const mergeSub = useCallback(
        (sub) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const subs = copySubs();
            const next = subs[index + 1];
            if (!next) return;
            let merge;
            if(!sub.text2) {
                merge = newSub({
                    start: sub.start,
                    end: next.end,
                    text: sub.text.trim() + '\n' + next.text.trim(),
                });
            } else {
                merge = newSub({
                    start: sub.start,
                    end: next.end,
                    text: sub.text.trim() + '\n' + next.text.trim(),
                    text2: sub.text2.trim() + '\n' + next.text2.trim(),
                });
            }
            subs[index] = merge;
            subs.splice(index + 1, 1);
            setSubtitle(subs);
        },
        [hasSub, copySubs, setSubtitle, newSub, viewEng],
    );

    const splitSub = useCallback(
        (sub, start) => {
            const index = hasSub(sub);
            if (index < 0 || !sub.text || !start) return;
            const text = (viewEng || !sub.text2) ? sub.text : sub.text2;
            const subs = copySubs();
            const textLeft = text.slice(0, start).trim();
            const textRight = text.slice(start).trim();
            if (!textLeft || !textRight) return;
            const splitDuration = (sub.duration * (start / text.length)).toFixed(3);
            if (splitDuration < 0.2 || sub.duration - splitDuration < 0.2) return;
            subs.splice(index, 1);
            const middleTime = DT.d2t(sub.startTime + parseFloat(splitDuration));
            if(viewEng || !sub.text2) {
                subs.splice(
                    index,
                    0,
                    newSub({
                        start: sub.start,
                        end: middleTime,
                        text: textLeft,
                        text2: (sub.text2 ? sub.text2 : '')
                    }),
                );
                subs.splice(
                    index + 1,
                    0,
                    newSub({
                        start: middleTime,
                        end: sub.end,
                        text: textRight,
                        text2: (sub.text2 ? sub.text2 : '')
                    }),
                );
            } else {
                subs.splice(
                    index,
                    0,
                    newSub({
                        start: sub.start,
                        end: middleTime,
                        text: sub.text,
                        text2: textLeft,
                    }),
                );
                subs.splice(
                    index + 1,
                    0,
                    newSub({
                        start: middleTime,
                        end: sub.end,
                        text: sub.text,
                        text2: textRight,
                    }),
                );
            }
            setSubtitle(subs);
        },
        [hasSub, copySubs, setSubtitle, newSub, viewEng],
    );

    const onKeyDown = useCallback(
        (event) => {
            const keyCode = getKeyCode(event);
            switch (keyCode) {
                case 32:
                    event.preventDefault();
                    if (player) {
                        if (playing) {
                            player.pause();
                        } else {
                            player.play();
                        }
                    }
                    break;
                case 90:
                    event.preventDefault();
                    if (event.metaKey) {
                        undoSubs();
                    }
                    break;
                default:
                    break;
            }
        },
        [player, playing, undoSubs],
    );

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);

    useMemo(() => {
        const currentIndex = subtitle.findIndex((item) => item.startTime <= currentTime && item.endTime > currentTime);
        setCurrentIndex(currentIndex);
    }, [currentTime, subtitle]);

    useEffect(() => {
        const localSubtitleString = window.localStorage.getItem('subtitle');
        const localYoutubeString = window.localStorage.getItem('yturl');
        const localLanguageString = window.localStorage.getItem('lang');
        if(localSubtitleString || localYoutubeString || localLanguageString) setResumed(true);
        if(localYoutubeString) setYoutubeUrl(JSON.parse(localYoutubeString));
        if(localLanguageString) setTranslate(JSON.parse(localLanguageString));
        const fetchSubtitle = () =>
            fetch('/sample.json')
                .then((res) => res.json())
                .then((res) => {
                    setSubtitleOriginal(res.map((item) => new Sub(item)));
                });

        if (localSubtitleString) {
            try {
                const localSubtitle = JSON.parse(localSubtitleString);
                if (localSubtitle.length) {
                    setSubtitleOriginal(localSubtitle.map((item) => new Sub(item)));
                } else {
                    fetchSubtitle();
                }
            } catch (error) {
                fetchSubtitle();
            }
        } else {
            fetchSubtitle();
        }
    }, [setSubtitleOriginal, setYoutubeUrl, setTranslate, setResumed]);

    const props = {
        player,
        setPlayer,
        subtitle,
        setSubtitle,
        waveform,
        setWaveform,
        currentTime,
        setCurrentTime,
        currentIndex,
        setCurrentIndex,
        playing,
        setPlaying,
        language,
        setLanguage,
        loading,
        setLoading,
        setProcessing,
        subtitleHistory,
        translate,
        setTranslate,
        youtubeUrl,
        setYoutubeUrl,
        resumed,
        setResumed,
        viewEng,
        setViewEng,

        notify,
        newSub,
        hasSub,
        checkSub,
        removeSub,
        addSub,
        undoSubs,
        clearSubs,
        updateSub,
        formatSub,
        mergeSub,
        splitSub,
    };

    return (
        <Style>
            <div className="main">
                <Player {...props} />
                <Subtitles {...props} />
                <Tool {...props} />
            </div>
            <Footer {...props} />
            {loading ? <Loading loading={loading} /> : null}
            {processing > 0 && processing < 100 ? <ProgressBar processing={processing} /> : null}
            <NotificationSystem ref={notificationSystem} allowHTML={true} />
        </Style>
    );
}
