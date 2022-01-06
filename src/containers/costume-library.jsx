import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';

import spriteTags from '../lib/libraries/sprite-tags';
import LibraryComponent from '../components/library/library.jsx';
import {getCostumeLibrary, getCustomCostumeLibrary} from '../lib/assets-api';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Costume',
        description: 'Heading for the costume library',
        id: 'gui.costumeLibrary.chooseACostume'
    }
});


class CostumeLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelected'
        ]);
        this.state = {
            data: [],
            haveData: false
        };
    }
    componentWillMount (){
        const that = this;
        document.addEventListener('pushCostumesLibrary', e => {
            console.log('pushCostumesLibrary');
            const data = e.detail.data.concat(that.state.data);
            that.setState({
                data: data,
                haveData: true
            });
        });
        window.scratch.pushCostumesLibrary = data => {
            const event = new CustomEvent('pushCostumesLibrary', {detail: {data: data}});
            document.dispatchEvent(event);
        };

        if (window.scratchConfig && window.scratchConfig.assets &&
            window.scratchConfig.assets.handleBeforeCostumesLibraryOpen){
            if (!window.scratchConfig.assets.handleBeforeCostumesLibraryOpen()){
                return;
            }
        }
        getCostumeLibrary().then(data => {
            data = data.concat(this.state.data);
            this.setState({
                data: data,
                haveData: true
            });
        });
        // 在这里设置localStorage图片的真实url
        getCustomCostumeLibrary().then(data => {
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
    handleItemSelected (item) {
        const vmCostume = {
            name: item.name,
            rotationCenterX: item.rotationCenterX,
            rotationCenterY: item.rotationCenterY,
            bitmapResolution: item.bitmapResolution,
            skinId: null
        };
        this.props.vm.addCostumeFromLibrary(item.md5ext, vmCostume);
    }
    render () {
        return this.state.haveData ? (
            <LibraryComponent
                data={this.state.data}
                id="costumeLibrary"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onItemSelected={this.handleItemSelected}
                onRequestClose={this.props.onRequestClose}
            />
        ) : '';
    }
}

CostumeLibrary.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(CostumeLibrary);
