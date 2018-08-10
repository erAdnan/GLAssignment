import { combineReducers } from 'redux';
import navigation from './navigation';

const clickSysApp = (initPath, initParams) =>
    combineReducers({
        navigation: navigation(initPath, initParams),
    });

export default (initPath, initParams) => clickSysApp(initPath, initParams);