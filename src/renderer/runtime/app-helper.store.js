import { writable, get, readable } from 'svelte/store';
import { getAllComponents } from '../config-blocks/_configs';

const ipcRenderer = window.sketchyAPI;


export function openInBrowser(url){
 // shell.openExternal(url)
}

//import { getGlobal } from '@electron/remote';
const trackEvent = function(){} //getGlobal('trackEvent');



const versionstring = '00000000'  // ipcRenderer.sendSync('app_version')

export const current_tooltip_store = writable({key: '', bool: false});

export const statusReport = writable({

  serialport: {
    

  }

})


export const appSettings = writable({
  size: 2.1,
  version: {
    major: versionstring.split('.')[0],
    minor: versionstring.split('.')[1],
    patch: versionstring.split('.')[2]
  },
  overlays: {controlElementName: false},
  debugMode: false,
  selectedDisplay: '',
  changeOnContact: true,
  layoutMode: false,
  configType: 'uiEvents',
  stringNameOverlay: false,
  preferences: false,
  modal: '',
  trayState: false,
  os: checkOS(),
  intervalPause: false,
  firmwareNotificationState: 0,
  sizeChange: 0,
  activeWindowResult: {
    title: undefined,
    owner: {neme: undefined}
  },
  persistant: {
    wssPort: 1337,
    moduleRotation: 0,
    welcomeOnStartup: true,
    lastVersion: '',
    profileFolder: '',
    pageActivatorEnabled: false,
    pageActivatorCriteria_0 : "",
    pageActivatorCriteria_1 : "",
    pageActivatorCriteria_2 : "",
    pageActivatorCriteria_3 : "",
    keyboardLayout : "",
    pageActivatorInterval: 1000,
    websocketMonitorEnabled: false,
    helperShape: 0,
    helperColor: 0,
    helperName: "Monster"
  }
});

export const profileListRefresh = writable(0);
export const presetListRefresh = writable(0);

let persistant = {
  wssPort: 1337,
  moduleRotation: 0,
  welcomeOnStartup: true,
  lastVersion: '',
  profileFolder: '',
  pageActivatorEnabled: false,
  pageActivatorCriteria_0 : "",
  pageActivatorCriteria_1 : "",
  pageActivatorCriteria_2 : "",
  pageActivatorCriteria_3 : "",
  keyboardLayout: "",
  pageActivatorInterval: 1000,
  websocketMonitorEnabled: false,
  helperShape: 0,
  helperColor: 0,
  helperName: "Monster"
}

init_appsettings();

appSettings.subscribe(store => {

  let instore = store.persistant;

  Object.entries(persistant).forEach(entry => {
    const [key, value] = entry;

    if (persistant[key] !== instore[key]){

      persistant[key] = instore[key];

      let foo = {};
      foo[key] = instore[key];
      //ipcRenderer.send('setStoreValue-message', foo);
    }


  });


})


/**
ipcRenderer.on('trayState', (event, args) => {

  if (get(appSettings).trayState === true && args === false){
    // restart session
    sessionid = Date.now();
  }

  console.log("traystate: ", args)
  appSettings.update(s => {s.trayState = args; return s;})  
})
 */

function init_appsettings(){



  let request = []
  Object.entries(persistant).forEach(entry => {

    const [key, value] = entry;
    request.push(key)

  });

  /**
  ipcRenderer.invoke('getStoreValues', request).then((response) => {

    appSettings.update(s => {

      Object.entries(response).forEach(entry => {

        let [key, value] = entry;

        // validate values, append default behavior

        if (key === "profileFolder" && value === undefined){
          value = ipcRenderer.sendSync('getProfileDefaultDirectory', 'foo');    
        }        
        
        if (key === "moduleRotation" && value === undefined){
          value = persistant[key]
        }
      
        if (key === "pageActivatorInterval" && value === undefined){
          value = 1000;
        }

        if (value !== undefined){

          s.persistant[key] = value;
          //console.log("init", key, value);
        }
    
      });

      return s;

    });


    // show welcome modal if it is not disabled, but always show after version update
    if (get(appSettings).persistant.welcomeOnStartup === undefined ||
        get(appSettings).persistant.welcomeOnStartup === true ||
        get(appSettings).persistant.lastVersion === undefined ||
        get(appSettings).persistant.lastVersion != versionstring){

      appSettings.update(s => {
        s.persistant.lastVersion = versionstring
        s.persistant.welcomeOnStartup = true
        s.modal = 'welcome'
        return s;
      });

    }  
  
  });

 */
}







export const preferenceStore = writable();



export const action_collection = readable(Promise.all([getAllComponents()]))

function createPresetManagement(){

  const _selected_preset = writable({sub: '', name: '', configs: ''});

  const _selected_action = writable({name: '', configs: ''});

  const _quick_access = writable([]);

  return {
    subscribe: _selected_preset.subscribe,
    selected_preset: {
      subscribe: _selected_preset.subscribe,
      update: ({sub, name, configs}) => {
        _selected_preset.set({sub: sub, name: name, configs: configs});
      },
    },
    selected_action: {
      subscribe: _selected_action.subscribe,
      update: ({name, configs}) => {
        _selected_action.set({name: name, configs: configs})
      }
    },
    quick_access: {
      subscribe: _quick_access.subscribe,
      update: () => {
        _quick_access.update(s => { if(s.length >= 4){ s.shift() }; s = [...s, get(_selected_preset)]; return s});
      }
    }
  }
}

//trackEvent('fw-editor-version', `v${get(appSettings).version.major}.${get(appSettings).version.minor}.${get(appSettings).version.patch}`);
//trackEvent('operating-system', process.platform)

export const activeDropDown = writable({config_index: undefined, input_index: undefined})

export const presetManagement = createPresetManagement();

export const layout = writable([]);

export const numberOfModulesStore = writable();

export const focusedCodeEditor = writable();

export const configNodeBinding = writable([]);
