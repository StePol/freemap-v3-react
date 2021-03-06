import axios from 'axios';
import { createLogic } from 'redux-logic';

import * as at from 'fm3/actionTypes';
import { startProgress, stopProgress } from 'fm3/actions/mainActions';
import { trackViewerSetTrackUID } from 'fm3/actions/trackViewerActions';
import { toastsAddError } from 'fm3/actions/toastsActions';

export default createLogic({
  type: at.TRACK_VIEWER_UPLOAD_TRACK,
  process({ getState, cancelled$, storeDispatch }, dispatch, done) {
    const { trackGpx } = getState().trackViewer;
    if (trackGpx.length > (process.env.MAX_GPX_TRACK_SIZE_IN_MB * 1000000)) {
      dispatch(toastsAddError('trackViewer.tooBigError', null, { maxSize: process.env.MAX_GPX_TRACK_SIZE_IN_MB }));
      done();
      return;
    }

    const pid = Math.random();
    dispatch(startProgress(pid));
    const source = axios.CancelToken.source();
    cancelled$.subscribe(() => {
      source.cancel();
    });

    axios.post(`${process.env.API_URL}/tracklogs`, {
      data: btoa(unescape(encodeURIComponent(trackGpx))),
      mediaType: 'application/gpx+xml',
    }, {
      validateStatus: status => status === 201,
      cancelToken: source.token,
    })
      .then(({ data }) => {
        dispatch(trackViewerSetTrackUID(data.uid));
      })
      .catch((err) => {
        dispatch(toastsAddError('trackViewer.savingError', err));
      })
      .then(() => {
        storeDispatch(stopProgress(pid));
        done();
      });
  },
});
