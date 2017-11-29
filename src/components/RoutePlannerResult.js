import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import turfLineDistance from '@turf/line-distance';
import { Polyline, Tooltip, Marker } from 'react-leaflet';

import RichMarker from 'fm3/components/RichMarker';
import ElevationChartActivePoint from 'fm3/components/ElevationChartActivePoint';
import { routePlannerSetStart, routePlannerSetFinish, routePlannerAddMidpoint, routePlannerSetMidpoint, routePlannerRemoveMidpoint }
  from 'fm3/actions/routePlannerActions';
import { toastsAdd } from 'fm3/actions/toastsActions';

import { sliceToGeojsonPoylines } from 'fm3/geoutils';
import * as FmPropTypes from 'fm3/propTypes';

const nf = Intl.NumberFormat('sk', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

class RoutePlannerResult extends React.Component {
  state = {
    lat: null,
    lon: null,
  }

  componentWillUnmount() {
    if (this.t) {
      clearTimeout(this.t);
    }
  }

  handleRouteMarkerDragEnd(movedPointType, position, event) {
    this.dragging = false;

    const { lat, lng: lon } = event.target.getLatLng();

    switch (movedPointType) {
      case 'start':
        this.props.onStartSet({ lat, lon });
        break;
      case 'finish':
        this.props.onFinishSet({ lat, lon });
        break;
      case 'midpoint':
        this.props.onMidpointSet(position, { lat, lon });
        break;
      default:
        throw new Error('unknown pointType');
    }
  }

  handleMidpointClick(position) {
    this.props.onRemoveMidpoint(position);
  }

  futureMidpointsAndDistances() {
    const {
      start, finish, midpoints, shapePoints,
    } = this.props;
    const midpointDistancesFromStart = [];
    let routeSlices = [];
    if ((start && finish && shapePoints)) {
      const splitPoints = [start, ...midpoints, finish];
      routeSlices = sliceToGeojsonPoylines(shapePoints, splitPoints);
      let distanceFromStart = 0;

      routeSlices.forEach((routeSlice) => {
        const length = turfLineDistance(routeSlice);
        distanceFromStart += length;
        midpointDistancesFromStart.push(distanceFromStart);
      });
    }

    return { midpointDistancesFromStart, routeSlices };
  }

  handleEndPointClick = () => {
    // just to prevent click propagation to map
  }

  handlePolyMouseMove = (e, segment) => {
    if (this.dragging) {
      return;
    }
    if (this.t) {
      clearTimeout(this.t);
      this.t = null;
    }
    this.setState({
      lat: e.latlng.lat,
      lon: e.latlng.lng,
      segment,
    });
  }

  handlePolyMouseOut = () => {
    if (this.dragging) {
      return;
    }
    this.resetOnTimeout();
  }

  handleFutureMouseOver = () => {
    if (this.dragging) {
      return;
    }
    if (this.t) {
      clearTimeout(this.t);
      this.t = null;
    }
  }

  handleFutureMouseOut = () => {
    if (this.dragging) {
      return;
    }
    this.resetOnTimeout();
  }

  resetOnTimeout() {
    if (this.t) {
      clearTimeout(this.t);
    }
    this.t = setTimeout(() => {
      this.setState({
        lat: null,
        lon: null,
      });
    }, 200);
  }

  handleDragStart = () => {
    if (this.t) {
      clearTimeout(this.t);
    }
    this.dragging = true;
  }

  handleFutureDragEnd = (e) => {
    this.dragging = false;
    this.setState({
      lat: null,
      lon: null,
    });

    this.props.onAddMidpoint(this.state.segment, {
      lat: e.target.getLatLng().lat,
      lon: e.target.getLatLng().lng,
    });
  }

  render() {
    const {
      start, midpoints, finish, time, distance, itinerary, itineraryIsVisible,
    } = this.props;
    const Icon = L.divIcon;
    const circularIcon = new Icon({ // CircleMarker is not draggable
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      html: '<div class="circular-leaflet-marker-icon"></div>',
    });
    const { midpointDistancesFromStart, routeSlices } = this.futureMidpointsAndDistances();

    return (
      <React.Fragment>
        {start &&
          <RichMarker
            faIcon="play"
            zIndexOffset={10}
            faIconLeftPadding="2px"
            color="#409a40"
            draggable
            onDragStart={this.handleDragStart}
            onDragEnd={e => this.handleRouteMarkerDragEnd('start', null, e)}
            position={L.latLng(start.lat, start.lon)}
            onClick={this.handleEndPointClick}
          />
        }
        {this.state.lat !== null && this.state.lon !== null &&
          <Marker
            draggable
            icon={circularIcon}
            onDragStart={this.handleDragStart}
            onDragEnd={this.handleFutureDragEnd}
            onMouseOver={this.handleFutureMouseOver}
            onMouseOut={this.handleFutureMouseOut}
            position={L.latLng(this.state.lat, this.state.lon)}
          />
        }
        {
          midpoints.filter((_, i) => midpointDistancesFromStart[i]).map(({ lat, lon }, i) => (
            <RichMarker
              draggable
              onDragStart={this.handleDragStart}
              onDragEnd={e => this.handleRouteMarkerDragEnd('midpoint', i, e)}
              onClick={() => this.handleMidpointClick(i)}
              key={`c4ReUQrKT7-${i}`}
              zIndexOffset={9}
              label={i + 1}
              position={L.latLng(lat, lon)}
            >
              {!itineraryIsVisible &&
                <Tooltip className="compact" offset={new L.Point(9, -25)} direction="right" permanent>
                  <span>{nf.format(midpointDistancesFromStart[i])} km</span>
                </Tooltip>}
            </RichMarker>
          ))
        }
        {finish &&
          <RichMarker
            faIcon="stop"
            color="#d9534f"
            zIndexOffset={10}
            draggable
            onDragStart={this.handleDragStart}
            onDragEnd={e => this.handleRouteMarkerDragEnd('finish', null, e)}
            position={L.latLng(finish.lat, finish.lon)}
            onClick={this.handleEndPointClick}
          >
            {distance !== null && time !== null &&
              <Tooltip offset={new L.Point(9, -25)} direction="right" permanent>
                <div>
                  <div>Vzdialenosť: {nf.format(distance)} km</div>
                  <div>Čas: {Math.floor(time / 60)} h {Math.round(time % 60)} m</div>
                </div>
              </Tooltip>
            }
          </RichMarker>
        }
        {
          itineraryIsVisible && itinerary.map(({ desc, lat, lon, km }, i) => (
            <RichMarker
              faIcon="info"
              color="grey"
              key={`Qc22mQrHUt-${i}`}
              position={L.latLng(lat, lon)}
            >
              <Tooltip className="compact" offset={new L.Point(9, -25)} direction="right" permanent>
                <span>{desc} ({nf.format(km)} km)</span>
              </Tooltip>
            </RichMarker>
          ))
        }
        {
          routeSlices.map((routeSlice, i) => (
            <Polyline
              positions={routeSlice.geometry.coordinates.map(lonlat => [lonlat[1], lonlat[0]])}
              weight="8"
              key={`TC7dnZUMAG-${i}`}
              color={i % 2 === 0 ? '#000' : '#000'}
              opacity={i % 2 === 0 ? 0.5 : 0.5}
              onMouseMove={e => this.handlePolyMouseMove(e, i)}
              onMouseOut={this.handlePolyMouseOut}
            />
          ))
        }
        <ElevationChartActivePoint />
      </React.Fragment>
    );
  }
}

RoutePlannerResult.propTypes = {
  start: FmPropTypes.point,
  finish: FmPropTypes.point,
  midpoints: FmPropTypes.points,
  shapePoints: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  time: PropTypes.number,
  distance: PropTypes.number,
  itinerary: PropTypes.arrayOf(PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    desc: PropTypes.string.isRequired,
    km: PropTypes.number.isRequired,
  })),
  itineraryIsVisible: PropTypes.bool.isRequired,
  onStartSet: PropTypes.func.isRequired,
  onFinishSet: PropTypes.func.isRequired,
  onMidpointSet: PropTypes.func.isRequired,
  onAddMidpoint: PropTypes.func.isRequired,
  onRemoveMidpoint: PropTypes.func.isRequired,
};

export default connect(
  state => ({
    start: state.routePlanner.start,
    finish: state.routePlanner.finish,
    midpoints: state.routePlanner.midpoints,
    shapePoints: state.routePlanner.shapePoints,
    time: state.routePlanner.time,
    distance: state.routePlanner.distance,
    itinerary: state.routePlanner.itinerary,
    itineraryIsVisible: state.routePlanner.itineraryIsVisible,
  }),
  dispatch => ({
    onStartSet(start) {
      dispatch(routePlannerSetStart(start));
    },
    onFinishSet(finish) {
      dispatch(routePlannerSetFinish(finish));
    },
    onAddMidpoint(position, midpoint) {
      dispatch(routePlannerAddMidpoint(midpoint, position));
    },
    onMidpointSet(position, midpoint) {
      dispatch(routePlannerSetMidpoint(position, midpoint));
    },
    onRemoveMidpoint(position) {
      dispatch(toastsAdd({
        collapseKey: 'routePlanner.removeMidpoint',
        message: 'Odstrániť zastávku?',
        style: 'warning',
        cancelType: 'SET_TOOL',
        actions: [
          { name: 'Áno', action: routePlannerRemoveMidpoint(position), style: 'danger' },
          { name: 'Nie' },
        ],
      }));
    },
  }),
)(RoutePlannerResult);
