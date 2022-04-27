import React, { useState, useEffect, createRef, useCallback, useMemo, memo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Translate } from 'react-i18nify';
import { ReactTransliterate } from "react-transliterate";
import styled from 'styled-components';
import backlight from '../libs/backlight';
import { isPlaying } from '../utils';

const Style = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 5% 5%;
    flex-direction: column;

    .video {
        display: flex;
        align-items: center;
        justify-content: center;
        height: auto;
        width: auto;
        position: relative;

        video {
            position: relative;
            z-index: 10;
            outline: none;
            max-height: 100%;
            max-width: 100%;
            box-shadow: 0px 5px 25px 5px rgb(0 0 0 / 80%);
            background-color: #000;
            cursor: pointer;
        }

        .videoPlaceholder {
            position: fixed;
            z-index: 20;
            outline: none;
            max-height: 40%;
            width: 620px;
            background-color: #000000dd;
            cursor: pointer;
            padding: 20px;
            font-size: 1.5em;
            color: white;
        }

        .subtitle {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: absolute;
            z-index: 20;
            left: 0;
            right: 0;
            bottom: 5%;
            width: 100%;
            padding: 0 20px;
            user-select: none;
            pointer-events: none;

            .operate {
                padding: 5px 15px;
                color: #fff;
                font-size: 13px;
                border-radius: 3px;
                margin-bottom: 5px;
                background-color: rgb(0 0 0 / 75%);
                border: 1px solid rgb(255 255 255 / 20%);
                cursor: pointer;
                pointer-events: all;
            }

            .textarea {
                width: 100%;
                outline: none;
                resize: none;
                text-align: center;
                line-height: 1.2;
                border: none;
                color: #fff;
                font-size: 20px;
                padding: 5px 10px;
                user-select: all;
                pointer-events: all;
                background-color: rgb(0 0 0 / 0);
                text-shadow: rgb(0 0 0) 1px 0px 1px, rgb(0 0 0) 0px 1px 1px, rgb(0 0 0) -1px 0px 1px,
                    rgb(0 0 0) 0px -1px 1px;

                &.pause {
                    background-color: rgb(0 0 0 / 50%);
                }
            }

            .container ul {
                padding: 0;
                z-index: 100;
                background-color: rgb(32, 32, 32);

                li:first-of-type {
                    font-weight: bold;
                    color: white;
                    background-color: rgb(0 87 158);
                }
            } 
        }
    }
`;

const VideoWrap = memo(
    ({ setPlayer, setCurrentTime, setPlaying }) => {
        const $video = createRef();

        useEffect(() => {
            setPlayer($video.current);
            (function loop() {
                window.requestAnimationFrame(() => {
                    if ($video.current) {
                        setPlaying(isPlaying($video.current));
                        setCurrentTime($video.current.currentTime || 0);
                    }
                    loop();
                });
            })();
        }, [setPlayer, setCurrentTime, setPlaying, $video]);

        const onClick = useCallback(() => {
            if ($video.current) {
                if (isPlaying($video.current)) {
                    $video.current.pause();
                } else {
                    $video.current.play();
                }
            }
        }, [$video]);

        return <video onClick={onClick} src="/sample.mp4?t=1" ref={$video} />;
    },
    () => true,
);

export default function Player(props) {
    const [currentSub, setCurrentSub] = useState(null);
    const [focusing, setFocusing] = useState(false);
    const [inputItemCursor, setInputItemCursor] = useState(0);
    const $player = createRef();

    useEffect(() => {
        if ($player.current && props.player && !backlight.state) {
            backlight.state = true;
            backlight($player.current, props.player);
        }
    }, [$player, props.player]);

    useMemo(() => {
        setCurrentSub(props.subtitle[props.currentIndex]);
    }, [props.subtitle, props.currentIndex]);

    const onChangeEng = useCallback(
        (event) => {
            props.player.pause();
            props.updateSub(currentSub, { text : event.target.value });
            if (event.target.selectionStart) {
                setInputItemCursor(event.target.selectionStart);
            }
        },
        [props, currentSub],
    );

    const onChangeTran = useCallback(
        (text) => {
            props.player.pause();
            props.updateSub(currentSub, { text2 : text });
        },
        [props, currentSub],
    );

    const onClick = useCallback(
        (event) => {
            props.player.pause();
            if (event.target.selectionStart) {
                setInputItemCursor(event.target.selectionStart);
            }
        },
        [props],
    );

    const onFocus = useCallback((event) => {
        setFocusing(true);
        if (event.target.selectionStart) {
            setInputItemCursor(event.target.selectionStart);
        }
    }, []);

    const onBlur = useCallback(() => {
        setTimeout(() => setFocusing(false), 500);
    }, []);

    const onSplit = useCallback(() => {
        props.splitSub(currentSub, inputItemCursor);
    }, [props, currentSub, inputItemCursor]);

    return (
        <Style className="player">
            <div className="video" ref={$player}>
                <VideoWrap {...props} />
                {props.player && currentSub ? (
                    <div className="subtitle">
                        {focusing ? (
                            <div className="operate" onClick={onSplit}>
                                <Translate value="SPLIT" />
                            </div>
                        ) : null}
                        {(props.viewEng || !currentSub.text2) ? (
                            <TextareaAutosize
                            className={`textarea ${!props.playing ? 'pause' : ''}`}
                            value={currentSub.text}
                            onChange={onChangeEng}
                            onClick={onClick}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            onKeyDown={onFocus}
                            spellCheck={false}
                        />
                        ) : (
                            <ReactTransliterate
                                    renderComponent={(props) => 
                                        <TextareaAutosize 
                                            className={`textarea ${!props.playing ? 'pause' : ''}`}
                                            onClick={onClick}
                                            onFocus={onFocus}
                                            onBlur={onBlur}
                                            onKeyDown={onFocus}
                                            spellCheck={false}
                                            {...props}
                                        />}
                                    value={currentSub.text2}
                                    containerClassName={[
                                        'container']
                                        .join(' ')
                                        .trim()}
                                    onChangeText={onChangeTran}
                                    lang={props.translate}
                                />
                        )}                        
                    </div>
                ) : null}
            </div>
        </Style>
    );
}
