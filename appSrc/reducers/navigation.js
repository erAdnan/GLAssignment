import { NavigationActions } from 'react-navigation';

// import { ReactModule } from '../lib/NativeModules';
import { deInitializeServices } from '../services';

import { getNavigatorForPath } from '../navigators';
import { createAppNavigator } from '../navigators/appnavigator';

import {
    getNavigationParams,
    initNavigationWithPath,
    dispatchNextAction,
} from '../actions/navigation';

let navigator = null;

function createInitialState(initPath, params = {}) {
    
    const initialAction = initNavigationWithPath(initPath, params);
    initialAction.path = initPath;
    initialAction.params = params;

    const nav = getNavigatorForPath(initialAction.path);
    let initialActionState;
    console.log('reducer nav:', nav)
    if (nav !== navigator) {
        initialActionState = createAppNavigator().router.getStateForAction(initialAction);
        // initialActionState = navigator.router.getStateForAction(initialAction);
        // initialActionState.routes[0].routes[0] = nav.router.getStateForAction(initialAction).routes[0];
        initialActionState.routes[0] = createAppNavigator().router.getStateForAction(initialAction).routes[0];
    } else {
        // initialActionState = navigator.router.getStateForAction(initialAction);
        initialActionState = createAppNavigator().router.getStateForAction(initialAction);
    }
    // return navigator.router.getStateForAction({}, initialActionState);
    return createAppNavigator().router.getStateForAction({}, initialActionState);
}

function deInitializeAndClose() {
    deInitializeServices();
    // ReactModule.close(ReactModule.reactTag);
}

function createNavigation(initPath, initParams) {
    navigator = createAppNavigator();

    const initialNavigationState = createInitialState(initPath, initParams);
    // const initialNavigationState = initialNavState;

    return (state = initialNavigationState, action) => {
        let nextState;
        let steps;
        let clearNextAction;
        switch (action.type) {
            case 'Navigation/NAVIGATE':
                nextState = navigator.router.getStateForAction(
                    NavigationActions.navigate({
                        routeName: action.routeName,
                        params: action.params,
                    }),
                    state,
                );
                break;
            case 'Navigation/BACK':
                steps = action.steps || 1;
                nextState = state;
                while (steps > 0) {
                    if (
                        nextState.routes.length === 0 ||
                        (nextState.routes.length === 1 && (!nextState.routes[0].routes || nextState.routes[0].routes.length <= 1))
                    ) {
                        // Navigate back to native if there's no further back
                        deInitializeAndClose();
                        return nextState;
                    }
                    nextState = navigator.router.getStateForAction(NavigationActions.back(), nextState);

                    steps -= 1;
                }
                break;
            case 'NAVIGATE_AND_CLEAR':
                nextState = navigator.router.getStateForAction(
                  NavigationActions.navigate({
                    routeName: action.routeName,
                    params: action.params,
                  }),
                  initialNavigationState,
                );
                break;    
            case 'NAVIGATE_BACK_TO_NATIVE':
                deInitializeAndClose();
                break;
           
            case dispatchNextAction().type:
                // clear next action.
                nextState = state;
                nextState.nextAction = null;
                clearNextAction = true;
                break;    
            default:
                nextState = navigator.router.getStateForAction(action, state);
                break;
        }

        if (!nextState) {
            nextState = state;
        }
        nextState.getParams = () => getNavigationParams(nextState);

        if (!clearNextAction) {
            nextState.nextAction = state.nextAction;
        }

        // Simply return the original `state` if `nextState` is null or undefined.
        return nextState || state;
    };
}

export default (initPath, initParams) => createNavigation(initPath, initParams);