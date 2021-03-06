import axios from 'axios';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import injectL10n from 'fm3/l10nInjector';
import PropTypes from 'prop-types';
import * as FmPropTypes from 'fm3/propTypes';
import { resolveTrackSurface, resolveTrackClass, resolveBicycleTypeSuitableForTrack } from 'fm3/osmOntologyTools';

function RoadDetails({ way, bbox, mapType, language, t }) {
  function handleJosmClick() {
    axios.get(`${window.location.protocol}//localhost:${window.location.protocol === 'http:' ? 8111 : 8112}/load_and_zoom`, {
      params: {
        select: `way${way.id}`,
        left: bbox[1],
        right: bbox[3],
        top: bbox[2],
        bottom: bbox[0],
      },
    });
  }

  const dateFormat = new Intl.DateTimeFormat(language, { day: '2-digit', month: '2-digit', year: 'numeric' });

  const trackClass = resolveTrackClass(way.tags);
  const surface = resolveTrackSurface(way.tags);
  const bicycleType = resolveBicycleTypeSuitableForTrack(way.tags);
  const isBicycleMap = mapType === 'C';
  const lastEditAt = dateFormat.format(new Date(way.timestamp));
  return (
    <div>
      <dl className="dl-horizontal">
        <dt>{t('roadDetails.roadType')}</dt>
        <dd style={{ whiteSpace: 'nowrap' }}>{t(`roadDetails.trackClasses.${trackClass}`) || trackClass}</dd>
        <dt>{t('roadDetails.surface')}</dt>
        <dd>{t(`roadDetails.surfaces.${surface}`) || surface}</dd>
        {isBicycleMap && <dt>{t('roadDetails.suitableBikeType')}</dt>}
        {isBicycleMap && <dd style={{ whiteSpace: 'nowrap' }}>{t(`roadDetails.bicycleTypes.${bicycleType}`)}</dd>}
        <dt>{t('roadDetails.lastChange')}</dt>
        <dd>{lastEditAt}</dd>
      </dl>
      <p>
        {
          t('roadDetails.edit', {
            id: () => (
              <a
                key="id"
                href={`https://www.openstreetmap.org/edit?editor=id&way=${way.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                iD
              </a>
            ),
            josm: () => (
              <a
                key="josm"
                onClick={handleJosmClick}
                role="button"
                tabIndex={0}
              >
                JOSM
              </a>
            ),
          })
        }
      </p>
    </div>
  );
}

RoadDetails.propTypes = {
  language: PropTypes.string,
  t: PropTypes.func.isRequired,
  way: PropTypes.shape({
    tags: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    timestamp: PropTypes.string.isRequired,
  }),
  bbox: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  mapType: FmPropTypes.mapType.isRequired,
};

export default compose(
  injectL10n(),
  connect(
    state => ({
      mapType: state.map.mapType,
      language: state.l10n.language,
    }),
  ),
)(RoadDetails);
