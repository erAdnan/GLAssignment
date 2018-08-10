import { NavigationActions } from 'react-navigation';
import { getNavigatorForPath } from '../navigators';
// import { ReactModule } from '../lib/NativeModules';
import { createAppNavigator } from '../navigators/appnavigator'
// Hax for broken react-navigation
function getActionForPathAndParams(path, params) {
    
    let correctedPath = path;
    // console.log('getActionForPathAndParams:', path)
    // console.log('getActionForPathAndParams params:', params)
    // if (params) {
    if (params && path) {
        correctedPath = path.replace(/:(\w+)/g, w => params[w.slice(1, w.length)]);
        if (correctedPath !== path) {
            correctedPath += '/hax';
        }
    }
    const navigator = getNavigatorForPath(path);
    // if (!navigator) {
    //     if (ReactModule.paths.includes(path)) {
    //         return navigateToNativePath(path, params);
    //     }
    //     throw new Error(`Missing handler for path: '${path}'`);
    // }
    // const action = navigator.router.getActionForPathAndParams(correctedPath, params || {});
    const action = createAppNavigator().router.getActionForPathAndParams(correctedPath, params || {});
    action.path = path;
    action.params = params;
    return action;
}

export const getNavigationParams = (parentRoute) => {
    console.log('getNavigationParams(parentRoute):', parentRoute)
    const { index, routes, params } = parentRoute;
    if (index >= 0 && routes) {
        return getNavigationParams(routes[index]);
    }
    
    console.log('getNavigationParams(params):', params)
    return params;
};

export const initNavigationWithPath = (path, params = {}) => {
    const action = getActionForPathAndParams(path, params);
    action.type = NavigationActions.INIT;
    return action;
};

//--navigations for each screen
export const NavigateToDetailsPage = (questionID) => getActionForPathAndParams('DetailScreen', { questionID: { id: questionID } });

export const navigateBack = (options) => {
    const action = NavigationActions.back(options);
    Object.assign(action, options);
    return action;
};

export const navigateAndPop = (options) => {
    const action = NavigationActions.pop(options);
    // const action = StackActions.pop({
    //     n: 1,
    //   });
    return action;
};

  
export const dispatchNextAction = (action) => {
    const actionType = 'DISPATCH_AND_CLEAR_NEXT_ACTION';
    const factory = (dispatch) => {
      dispatch(action);
      dispatch({
        type: actionType,
      });
    };
    factory.type = actionType;
    return factory;
};
