import React from 'react';
import { connect } from 'react-redux';
import Point from 'fm3/components/searchResults/Point';
import MultiPoint from 'fm3/components/searchResults/MultiPoint';
import Polyline from 'fm3/components/searchResults/Polyline';
import Polygon from 'fm3/components/searchResults/Polygon';
import MultiLineString from 'fm3/components/searchResults/MultiLineString';
import MultiPolygon from 'fm3/components/searchResults/MultiPolygon';
import * as FmPropTypes from 'fm3/propTypes';

function SearchResults({ highlightedResult, selectedResult }) {
  return (
    <React.Fragment>
      {displayAsPoint(highlightedResult) && <Point searchResult={highlightedResult} />}
      {displayAsMultiPoint(highlightedResult) && <MultiPoint searchResult={highlightedResult} />}
      {displayAsPolyline(highlightedResult) && <Polyline searchResult={highlightedResult} />}
      {displayAsMultiLineString(highlightedResult) && <MultiLineString searchResult={highlightedResult} />}
      {displayAsPolygon(highlightedResult) && <Polygon searchResult={highlightedResult} />}
      {displayAsMultiPolygon(highlightedResult) && <MultiPolygon searchResult={highlightedResult} />}
      {displayAsPoint(selectedResult) && <Point searchResult={selectedResult} />}
      {displayAsMultiPoint(selectedResult) && <MultiPoint searchResult={selectedResult} />}
      {displayAsPolyline(selectedResult) && <Polyline searchResult={selectedResult} />}
      {displayAsMultiLineString(selectedResult) && <MultiLineString searchResult={selectedResult} />}
      {displayAsPolygon(selectedResult) && <Polygon searchResult={selectedResult} />}
      {displayAsMultiPolygon(selectedResult) && <MultiPolygon searchResult={selectedResult} />}
    </React.Fragment>
  );
}

SearchResults.propTypes = {
  highlightedResult: FmPropTypes.searchResult,
  selectedResult: FmPropTypes.searchResult,
};

function displayAsPoint(result) {
  return result && result.geojson.type === 'Point';
}

function displayAsMultiPoint(result) {
  return result && result.geojson.type === 'MultiPoint';
}

function displayAsPolyline(result) {
  return result && (result.geojson.type === 'LineString');
}

function displayAsPolygon(result) {
  return result && (result.geojson.type === 'Polygon');
}

function displayAsMultiPolygon(result) {
  return result && (result.geojson.type === 'MultiPolygon');
}

function displayAsMultiLineString(result) {
  return result && (result.geojson.type === 'MultiLineString');
}

export default connect(state => ({
  highlightedResult: state.search.highlightedResult,
  selectedResult: state.search.selectedResult,
}))(SearchResults);
