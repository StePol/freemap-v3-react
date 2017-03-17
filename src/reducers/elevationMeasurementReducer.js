const initialState = {
  elevation: null,
  point: null
};

export default function elevationMeasurement(state = initialState, action) {
  switch (action.type) {
    case 'RESET_MAP':
    case 'SET_TOOL':
      return initialState;
    case 'SET_ELEVATION':
      return { ...state, elevation: action.elevation };
    case 'SET_ELEVATION_POINT':
      return { ...state, point: action.point };
    default:
      return state;
  }
}
