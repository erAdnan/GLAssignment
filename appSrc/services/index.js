import { NativeEventEmitter } from 'react-native';

let isInitialized = false;

function logResponseListener(eventName, payload) {
    console.log('services logResponseListener: ', eventName, payload);
}

let events = {};

export const deInitializeServices = () => {
    if (!isInitialized) {
        return;
    }

    const listeners = Object.values(events);
    for (let i = 0; i < listeners.length; i += 1) {
        const event = listeners[i];
        event.remove();
    }
    events = {};
    isInitialized = false;
};

export const initializeServices = (dispatch) => {
    if (isInitialized) {
        deInitializeServices();
    }
    isInitialized = true;

};

export default {
    initializeServices,
    deInitializeServices,
};