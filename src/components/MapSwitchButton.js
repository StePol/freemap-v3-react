import { connect } from 'react-redux';
import { compose } from 'redux';
import React from 'react';
import PropTypes from 'prop-types';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Button from 'react-bootstrap/lib/Button';
import Overlay from 'react-bootstrap/lib/Overlay';
import Popover from 'react-bootstrap/lib/Popover';
import FontAwesomeIcon from 'fm3/components/FontAwesomeIcon';
import { baseLayers, overlayLayers } from 'fm3/mapDefinitions';
import * as FmPropTypes from 'fm3/propTypes';
import { mapRefocus } from 'fm3/actions/mapActions';
import injectL10n from 'fm3/l10nInjector';

class MapSwitchButton extends React.Component {
  static propTypes = {
    zoom: PropTypes.number.isRequired,
    overlays: FmPropTypes.overlays.isRequired,
    mapType: FmPropTypes.mapType.isRequired,
    onMapRefocus: PropTypes.func.isRequired,
    expertMode: PropTypes.bool,
    pictureFilterIsActive: PropTypes.bool,
    isAdmin: PropTypes.bool,
    t: PropTypes.func.isRequired,
  };

  state = {
    show: false,
  }

  setButton = (button) => {
    this.button = button;
  };

  handleButtonClick = () => {
    this.setState({ show: true });
  }

  handleHide = () => {
    this.setState({ show: false });
  }

  handleMapSelect = (mapType) => {
    this.setState({ show: false });
    if (this.props.mapType !== mapType) {
      this.props.onMapRefocus({ mapType });
    }
  }

  handleOverlaySelect = (overlay) => {
    const s = new Set(this.props.overlays);
    if (s.has(overlay)) {
      s.delete(overlay);
    } else {
      s.add(overlay);
    }
    this.props.onMapRefocus({ overlays: [...s] });
  }

  render() {
    const { isAdmin, t, mapType, overlays, expertMode, zoom, pictureFilterIsActive } = this.props;

    return (
      <React.Fragment>
        <Button ref={this.setButton} onClick={this.handleButtonClick} title={t('mapLayers.layers')}>
          <FontAwesomeIcon icon="map-o" />
        </Button>
        <Overlay rootClose placement="top" show={this.state.show} onHide={this.handleHide} target={() => this.button}>
          <Popover id="popover-trigger-click-root-close" className="fm-menu">
            <ul>
              {
                baseLayers
                  .filter(({ showOnlyInExpertMode }) => !showOnlyInExpertMode || expertMode)
                  .filter(({ adminOnly }) => isAdmin || !adminOnly)
                  .map(({ type, icon, minZoom, key }) => (
                    <MenuItem
                      key={type}
                      onClick={() => this.handleMapSelect(type)}
                    >
                      <FontAwesomeIcon icon={mapType === type ? 'check-circle-o' : 'circle-o'} />
                      {' '}
                      <FontAwesomeIcon icon={icon || 'map-o'} />
                      {' '}
                      <span style={{ textDecoration: zoom < minZoom ? 'line-through' : 'none' }}>
                        {t(`mapLayers.base.${type}`)}
                      </span>
                      {key && ' '}
                      {key && <kbd>{key}</kbd>}
                    </MenuItem>
                  ))
              }
              <MenuItem divider />
              {
                overlayLayers
                  .filter(({ showOnlyInExpertMode }) => !showOnlyInExpertMode || expertMode)
                  .filter(({ adminOnly }) => isAdmin || !adminOnly)
                  .map(({ type, icon, minZoom, key }) => (
                    <MenuItem
                      key={type}
                      onClick={() => this.handleOverlaySelect(type)}
                    >
                      <FontAwesomeIcon icon={overlays.includes(type) ? 'check-square-o' : 'square-o'} />
                      {' '}
                      <FontAwesomeIcon icon={icon || 'map-o'} />
                      {' '}
                      <span style={{ textDecoration: zoom < minZoom ? 'line-through' : 'none' }}>
                        {t(`mapLayers.overlay.${type}`)}
                      </span>
                      {key && ' '}
                      {key && <kbd>{key}</kbd>}
                      {zoom < minZoom &&
                        <React.Fragment>
                          {' '}
                          <FontAwesomeIcon
                            icon="exclamation-triangle"
                            title={t('mapLayers.minZoomWarning', { minZoom })}
                            className="text-warning"
                          />
                        </React.Fragment>
                      }
                      {type === 'I' && pictureFilterIsActive &&
                        <React.Fragment>
                          {' '}
                          <FontAwesomeIcon
                            icon="filter"
                            title={t('mapLayers.photoFilterWarning')}
                            className="text-warning"
                          />
                        </React.Fragment>
                      }
                    </MenuItem>
                  ))
              }
            </ul>
          </Popover>
        </Overlay>

        <div
          style={{
            position: 'fixed',
            right: '0px',
            bottom: '0px',
            zIndex: 10,
            backgroundColor: 'white',
            padding: '0 6px',
            borderTopLeftRadius: '4px',
            borderTop: '1px solid #ccc',
            borderLeft: '1px solid #ccc',
            fontSize: '12px',
          }}
        >
          {
            categorize(
              [
                ...baseLayers.filter(({ type }) => mapType === type),
                ...overlayLayers.filter(({ type }) => overlays.includes(type)),
              ].reduce((a, b) => [...a, ...b.attribution], []),
            ).map(({ type, attributions }, i) => [
              i > 0 ? '; ' : '',
              t(`mapLayers.type.${type}`),
              ' ',
              attributions.map((a, j) => [
                j > 0 ? ', ' : '',
                a.url ? <a key={a} href={a.url} target="_blank">{a.name || t(a.nameKey)}</a> : a.name || t(a.nameKey),
              ]),
            ])
          }
        </div>
      </React.Fragment>
    );
  }
}

function categorize(attributions) {
  const res = {};
  attributions.forEach((attribution) => {
    let x = res[attribution.type];
    if (!x) {
      x = [];
      res[attribution.type] = x;
    }
    if (!x.includes(attribution)) {
      x.push(attribution);
    }
  });
  return Object.keys(res).map(type => ({ type, attributions: res[type] }));
}

export default compose(
  injectL10n(),
  connect(
    state => ({
      zoom: state.map.zoom,
      mapType: state.map.mapType,
      overlays: state.map.overlays,
      expertMode: state.main.expertMode,
      pictureFilterIsActive: Object.keys(state.gallery.filter).some(key => state.gallery.filter[key]),
      isAdmin: !!(state.auth.user && state.auth.user.isAdmin),
    }),
    dispatch => ({
      onMapRefocus(changes) {
        dispatch(mapRefocus(changes));
      },
    }),
  ),
)(MapSwitchButton);
