import React from 'react';
import PropTypes from 'prop-types';
import {
    Animated,
    Easing
  } from 'react-native'
import { connect } from 'react-redux';
import { addNavigationHelpers, StackNavigator } from 'react-navigation';
import { addListener } from '../reduxHelper/reduxHelper';

import HomeScreen from '../layouts/HomeScreen';
import DetailScreen from '../layouts/DetailScreen';

let navigatorInstance = null;

export const AppRoutes = {
    HomeScreen: {
        path: 'HomeScreen',
        screen: HomeScreen,
    },
    DetailScreen: {
        path: 'DetailScreen',
        screen: DetailScreen,
    },
};

const transitionConfig = () => {
    return {
      transitionSpec: {
        duration: 250,
        easing: Easing.out(Easing.poly(4)),
        timing: Animated.timing,
        useNativeDriver: true,
      },
      screenInterpolator: sceneProps => {
          const { position, layout, scene, index, scenes } = sceneProps
          const toIndex = index
          const thisSceneIndex = scene.index
          const height = layout.initHeight
          const width = layout.initWidth
    
          const translateX = position.interpolate({
            inputRange: [thisSceneIndex - 1, thisSceneIndex, thisSceneIndex + 1],
            outputRange: [width, 0, 0]
          })
    
          // Since we want the card to take the same amount of time
          // to animate downwards no matter if it's 3rd on the stack
          // or 53rd, we interpolate over the entire range from 0 - thisSceneIndex
          const translateY = position.interpolate({
            inputRange: [0, thisSceneIndex],
            outputRange: [height, 0]
          })
    
          const slideFromRight = { transform: [{ translateX }] }
          const slideFromBottom = { transform: [{ translateY }] }
    
          const lastSceneIndex = scenes[scenes.length - 1].index
    
          // Test whether we're skipping back more than one screen
          if (lastSceneIndex - toIndex > 1) {
            // Do not transoform the screen being navigated to
            if (scene.index === toIndex) return
            // Hide all screens in between
            if (scene.index !== lastSceneIndex) return { opacity: 0 }
            // Slide top screen down
            return slideFromBottom
          }
    
          return slideFromRight
        },
    }
}

export const createAppNavigator = (initialRouteName = null) => {
    if (initialRouteName !== null) {
        // create a new AppNavigator if initialRouteName is specified.
        navigatorInstance = StackNavigator(AppRoutes, {
            transitionConfig,
            initialRouteName,
            navigationOptions: {
                header: null,
            },
            mode: 'card',
        });
    } else if (navigatorInstance === null) {
        // create a temporary AppNavigator if no initialRouteName is
        // specified and there is no navigatorInstance.
        return StackNavigator(AppRoutes, {
            transitionConfig,
            navigationOptions: {
                header: null,
            },
            mode: 'card',
        });
    }
    return navigatorInstance;
};

function createAppWithNavigationState(initialRouteName = null) {
    const Navigator = createAppNavigator(initialRouteName);

    const AppWithNavigationState = ({ dispatch, navigation }) => ( 
        < Navigator navigation = { addNavigationHelpers({ dispatch, state: navigation, addListener }) } />
    );
    AppWithNavigationState.propTypes = {
        dispatch: PropTypes.func.isRequired,
        navigation: PropTypes.instanceOf(Object).isRequired,
    };
    return AppWithNavigationState;
}

const mapStateToProps = state => ({
    navigation: state.navigation,
});

export default (initialRouteName = null) => connect(mapStateToProps)(createAppWithNavigationState(initialRouteName));