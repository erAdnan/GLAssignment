// Main navigation container

import React, { Component } from 'react';
import { Dimensions, View, AsyncStorage } from 'react-native';
import PropTypes from 'prop-types';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { middleware } from '../reduxHelper/reduxHelper';
  
import { initializeServices } from '../services';
import reducer from '../reducers';

import createNavigators from '../navigators';
import createAppWithNavigationState from '../navigators/appnavigator';

const { width, height } = Dimensions.get('window');

const loggerMiddleware = createLogger();

let AppWithNavigationState = null;

class App extends Component {
    static propTypes = {
        path: PropTypes.string,
        actions: PropTypes.instanceOf(Array),
        params: PropTypes.instanceOf(Object),
    };
    static defaultProps = {
        params: undefined,
        actions: [],
    };

    constructor(props) {
        super(props);
        createNavigators(props.path);

        AppWithNavigationState = createAppWithNavigationState();

        const middlesWares = [
            thunkMiddleware, // lets us dispatch() functions
        ];

        if (process.env.NODE_ENV === 'development') {
            middlesWares.push(loggerMiddleware);
        }

        this.store = createStore(reducer(props.path, props.params), applyMiddleware(...middlesWares));

        initializeServices(this.store.dispatch);

        this.state = {};

        for (let i = 0; i < props.actions.length; i += 1) {
            const action = props.actions[i];
            this.store.dispatch(action);
        }
        console.ignoredYellowBox = ['Warning:'];
    }

    render() {
        return ( <View style = {
                { flex: 1 }
            } >
            <Provider store = { this.store } >
            <AppWithNavigationState/>
            </Provider>
            </View >
        );
    }
}

export default App;