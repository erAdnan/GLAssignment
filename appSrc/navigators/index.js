import { createAppNavigator, AppRoutes } from './appnavigator';

let navigators = {};
const routes = {
    AppNavigator: AppRoutes,
};

function NavigatorException(message) {
    return {
        message,
        name: 'NavigatorException',
    };
}

export function getNavigatorForPath(path) {
    const results = Object.keys(navigators).filter((key) => {
        const navigator = navigators[key];
        const navigatorRoutes = Object.keys(navigator.routes).filter(
            k => navigator.routes[k].path === path,
        );
        if (navigatorRoutes.length > 1) {
            throw NavigatorException('Duplicate of paths!');
        }
        return navigatorRoutes.length > 0;
    });
    if (results.length > 1) {
        throw NavigatorException('Duplicate of paths!');
    }
    return results.length === 1 ? navigators[results[0]].navigator : null;
}

function getRouteNamesForPath(path) {
    const results = {};
    Object.keys(routes).filter((key) => {
        const navigatorRoutes = Object.keys(routes[key]).filter(k => path.match(routes[key][k].path) !== null);
        if (navigatorRoutes.length > 1) {
            throw NavigatorException('Duplicate of paths!');
        }
        results[key] = navigatorRoutes.length > 0 ? navigatorRoutes[0] : 0;
        return true;
    });
    return results;
}

export default function(initialPath = null) {
    if (initialPath !== null) {
        const routeNames = getRouteNamesForPath(initialPath);
        navigators = {
            AppNavigator: {
                routes: AppRoutes,
                navigator: createAppNavigator(routeNames.AppNavigator),
            },
        };
    } else {
        navigators = {
            AppNavigator: {
                routes: AppRoutes,
                navigator: createAppNavigator(),
            },
        };
    }
    return {
        AppNavigator: navigators.AppNavigator.navigator,
    };
}
