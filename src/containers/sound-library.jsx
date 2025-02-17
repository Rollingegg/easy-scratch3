import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import AudioEngine from 'scratch-audio';

import LibraryComponent from '../components/library/library.jsx';

import soundIcon from '../components/library-item/lib-icon--sound.svg';
import soundIconRtl from '../components/library-item/lib-icon--sound-rtl.svg';

import soundTags from '../lib/libraries/sound-tags';

import {connect} from 'react-redux';

import {getCustomSoundLibrary, getSoundLibrary} from '../lib/assets-api';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sound',
        description: 'Heading for the sound library',
        id: 'gui.soundLibrary.chooseASound'
    }
});

class SoundLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelected',
            'handleItemMouseEnter',
            'handleItemMouseLeave',
            'onStop',
            'setStopHandler'
        ]);

        /**
         * AudioEngine that will decode and play sounds for us.
         * @type {AudioEngine}
         */
        this.audioEngine = null;
        /**
         * A promise for the sound queued to play as soon as it loads and
         * decodes.
         * @type {Promise<SoundPlayer>}
         */
        this.playingSoundPromise = null;

        /**
         * function to call when the sound ends
         */
        this.handleStop = null;
        this.state = {
            data: [],
            haveData: false
        };
    }
    componentWillMount (){
        const that = this;
        document.addEventListener('pushSoundsLibrary', e => {
            console.log('pushSoundsLibrary');
            const data = e.detail.data.concat(that.state.data);
            that.setState({
                data: data,
                haveData: true
            });
        });
        window.scratch.pushSoundsLibrary = data => {
            const event = new CustomEvent('pushSoundsLibrary', {detail: {data: data}});
            document.dispatchEvent(event);
        };

        if (window.scratchConfig &&
            window.scratchConfig.assets &&
            window.scratchConfig.assets.handleBeforeSoundLibraryOpen){
            if (!window.scratchConfig.assets.handleBeforeSoundLibraryOpen()){
                return;
            }
        }
        getSoundLibrary().then(data => {
            data = data.concat(this.state.data);
            this.setState({
                data: data,
                haveData: true
            });
        });

        // 在这里设置localStorage声音的真实url
        getCustomSoundLibrary().then(data => {
            if (Array.isArray(data)){
                data.forEach(asset => {
                    window.localStorage.setItem(asset.md5ext,
                        `${window.__CONFIG.MINIO_URL}/${window.__CONFIG.ASSET_PREFIX}${asset.md5ext}`);
                });
                data = data.concat(this.state.data);
                this.setState({
                    data: data,
                    haveData: true
                });
            }
        });
    }
    componentDidMount () {
        this.audioEngine = new AudioEngine();
        this.playingSoundPromise = null;
    }
    componentWillUnmount () {
        this.stopPlayingSound();
    }
    onStop () {
        if (this.playingSoundPromise !== null) {
            this.playingSoundPromise.then(soundPlayer => soundPlayer.removeListener('stop', this.onStop));
            if (this.handleStop) this.handleStop();
        }

    }
    setStopHandler (func) {
        this.handleStop = func;
    }
    stopPlayingSound () {
        // Playback is queued, playing, or has played recently and finished
        // normally.
        if (this.playingSoundPromise !== null) {
            // Forcing sound to stop, so stop listening for sound ending:
            this.playingSoundPromise.then(soundPlayer => soundPlayer.removeListener('stop', this.onStop));
            // Queued playback began playing before this method.
            if (this.playingSoundPromise.isPlaying) {
                // Fetch the player from the promise and stop playback soon.
                this.playingSoundPromise.then(soundPlayer => {
                    soundPlayer.stop();
                });
            } else {
                // Fetch the player from the promise and stop immediately. Since
                // the sound is not playing yet, this callback will be called
                // immediately after the sound starts playback. Stopping it
                // immediately will have the effect of no sound being played.
                this.playingSoundPromise.then(soundPlayer => {
                    soundPlayer.stopImmediately();
                });
            }
            // No further work should be performed on this promise and its
            // soundPlayer.
            this.playingSoundPromise = null;
        }
    }
    handleItemMouseEnter (soundItem) {
        const md5ext = soundItem._md5;
        const idParts = md5ext.split('.');
        const md5 = idParts[0];
        const ext = idParts[1];
        const vm = this.props.vm;

        // In case enter is called twice without a corresponding leave
        // inbetween, stop the last playback before queueing a new sound.
        this.stopPlayingSound();

        // Save the promise so code to stop the sound may queue the stop
        // instruction after the play instruction.
        this.playingSoundPromise = vm.runtime.storage.load(vm.runtime.storage.AssetType.Sound, md5, ext)
            .then(soundAsset => {
                const sound = {
                    md5: md5ext,
                    name: soundItem.name,
                    format: soundItem.format,
                    data: soundAsset.data
                };
                // console.log('sound', sound);
                return this.audioEngine.decodeSoundPlayer(sound);
            })
            .then(soundPlayer => {
                soundPlayer.connect(this.audioEngine);
                // Play the sound. Playing the sound will always come before a
                // paired stop if the sound must stop early.
                soundPlayer.play();
                soundPlayer.addListener('stop', this.onStop);
                // Set that the sound is playing. This affects the type of stop
                // instruction given if the sound must stop early.
                if (this.playingSoundPromise !== null) {
                    this.playingSoundPromise.isPlaying = true;
                }
                return soundPlayer;
            });
    }
    handleItemMouseLeave () {
        this.stopPlayingSound();
    }
    handleItemSelected (soundItem) {
        const vmSound = {
            format: soundItem.format,
            md5: soundItem._md5,
            rate: soundItem.rate,
            sampleCount: soundItem.sampleCount,
            name: soundItem.name
        };
        this.props.vm.addSound(vmSound).then(() => {
            this.props.onNewSound();
        });
    }
    getSoundLibraryThumbnailData (data){
        // @todo need to use this hack to avoid library using md5 for image
        return data.map(sound => {
            const {
                md5ext,
                ...otherData
            } = sound;
            return {
                _md5: md5ext,
                rawURL: this.props.isRtl ? soundIconRtl : soundIcon,
                ...otherData
            };
        });
    }
    render () {
        return this.state.haveData ? (
            <LibraryComponent
                showPlayButton
                data={this.getSoundLibraryThumbnailData(this.state.data)}
                id="soundLibrary"
                setStopHandler={this.setStopHandler}
                tags={soundTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onItemMouseEnter={this.handleItemMouseEnter}
                onItemMouseLeave={this.handleItemMouseLeave}
                onItemSelected={this.handleItemSelected}
                onRequestClose={this.props.onRequestClose}
            />
        ) : '';
    }
}

SoundLibrary.propTypes = {
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onNewSound: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(SoundLibrary));
