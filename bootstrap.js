/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const {interfaces: Ci, utils: Cu} = Components;
const {Services: {wm}} = Cu.import("resource://gre/modules/Services.jsm", {});

const BROWSER = "navigator:browser";
const TOOLBOX = "navigator-toolbox";

// Modify browser windows to hide the toolbars.
function hideToolbars({document}) {
  // Only bother hiding for browser windows.
  if (document.documentElement.getAttribute("windowtype") === BROWSER) {
    // Hide the whole toolbox and move content up.
    let toolbox = document.getElementById(TOOLBOX);
    toolbox.style.marginBottom = -toolbox.boxObject.height + "px";
    toolbox.style.transform = "scale(0)";
  }
}

// Clean up toolbar modifications.
hideToolbars.cleanup = ({document}) => {
  let {style} = document.getElementById(TOOLBOX);
  style.marginBottom = "";
  style.transform = "";
};

// Handle new windows opening.
hideToolbars.onOpenWindow = window => {
  // Wait for the window to finish loading once.
  window = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
  window.addEventListener("load", function listener() {
    window.removeEventListener("load", listener);
    window.setTimeout(_ => hideToolbars(window));
  });
};

// Handle add-on starting.
function startup() {
  // Attach to existing browser windows, for modifying UI.
  let windows = wm.getEnumerator(BROWSER);
  while (windows.hasMoreElements()) {
    hideToolbars(windows.getNext());
  }

  // Wait for any new browser windows to open.
  wm.addListener(hideToolbars);
}

// Handle add-on stopping.
function shutdown() {
  // Detach from browser windows.
  let windows = wm.getEnumerator(BROWSER);
  while (windows.hasMoreElements()) {
    hideToolbars.cleanup(windows.getNext());
  }

  // Stop waiting for browser windows to open.
  wm.removeListener(hideToolbars);
}

function install() {}
function uninstall() {}
