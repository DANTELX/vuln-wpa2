import { DOMElements } from "./dom.js";
import { terminal } from "./term.js";

let app;
if (terminal) {
  class App {
    constructor() {
      // App fields
      this._promptInputFocus;
      this._started = false;
      this._closedWindowBind = this._closedWindow.bind(this);
      this.exeTimeOut = 0;

      // INIT
      this._init();

      // DOM Events
      DOMElements.termEl.addEventListener("click", () => {
        DOMElements.promptInputEl.focus();
      });

      DOMElements.promptInputEl.addEventListener("focus", () => {
        this.promptInputFocus = true;
      });

      DOMElements.promptInputEl.addEventListener("focusout", () => {
        this.promptInputFocus = false;
      });

      DOMElements.authFormEl.addEventListener("submit", (e) => this._auth(e));

      addEventListener("keydown", (e) => this._keyPress(e));

      addEventListener("beforeunload", this._closedWindowBind);
    }

    // App methods
    removeAllChildNodes(parent, exception) {
      while (parent.lastChild) {
        if (parent.firstChild === exception) break;
        parent.removeChild(parent.firstChild);
      }
    }

    randomNumber(maxNumber, minNumber = 0) {
      return Math.floor(Math.random() * (maxNumber - minNumber)) + minNumber;
    }

    genMAC() {
      return "XX:XX:XX:XX:XX:XX".replace(/X/g, function () {
        return "0123456789abcdef".charAt(Math.floor(Math.random() * 16));
      });
    }

    _keyPress(e) {
      if (!this.promptInputFocus) return;

      if (e.key === "Enter") {
        if (terminal.stopExecution) return;
        if (!DOMElements.promptInputEl.value) {
          terminal.stdout(terminal.prompt);
        } else {
          terminal.executecmd(DOMElements.promptInputEl.value);
        }

        terminal._scrollToBottom();
      }

      if (!terminal.termHistory[1]) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (terminal.termHistoryPosition < terminal.termHistory.length - 1) {
          DOMElements.promptInputEl.value =
            terminal.termHistory[++terminal.termHistoryPosition];
        } else {
          DOMElements.promptInputEl.value =
            terminal.termHistory[terminal.termHistoryPosition];
        }
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (terminal.termHistoryPosition > 0) {
          DOMElements.promptInputEl.value =
            terminal.termHistory[--terminal.termHistoryPosition];
        } else {
          DOMElements.promptInputEl.value =
            terminal.termHistory[terminal.termHistoryPosition];
        }
      }
    }

    _auth(e) {
      e.preventDefault();
      const password = DOMElements.authInputEl.value;

      if (password === terminal.interfaces[2].networks.network1.password) {
        location = `${location.protocol}//${location.host}/congratulations.html`;
        localStorage.setItem("finished", "true");
      } else {
        DOMElements.authSubmitEl.setAttribute("value", "WRONG PASSWORD");
        DOMElements.authSubmitEl.classList.add("auth-submit--wrong");
        setTimeout(() => {
          DOMElements.authSubmitEl.setAttribute("value", "CONNECT");
          DOMElements.authSubmitEl.classList.remove("auth-submit--wrong");
        }, 1000);
      }
    }

    _closedWindow() {
      if (!this._started) this._started = true;
      this._setLocalStorage("app", {
        _started: this._started,
      });
      this._setLocalStorage("terminal", {
        termHistory: terminal.termHistory,
        interfaces: terminal.interfaces,
        currentTask: terminal.currentTask,
        completedTasks: terminal.completedTasks,
        tasksData: terminal.tasksData,
        files: terminal.files,
      });
    }

    _clearLocalStorage() {
      localStorage.clear();
      removeEventListener("beforeunload", this._closedWindowBind);
      location.reload();
    }

    _setLocalStorage(tag, object) {
      localStorage.setItem(tag, JSON.stringify(object));
    }

    _getLocalStorage() {
      return {
        app: JSON.parse(localStorage.getItem("app")),
        terminal: JSON.parse(localStorage.getItem("terminal")),
      };
    }

    _init() {
      const localData = this._getLocalStorage();

      if (localData.terminal && localData.app) {
        // Reassign variables of localStorage
        for (const [key, _] of Object.entries(localData)) {
          for (const [key2, value] of Object.entries(localData[key])) {
            if (key === "app") this[key2] = value;
            if (key === "terminal") terminal[key2] = value;
          }
        }
      }

      for (const [_, value] of Object.entries(terminal.tasksData)) {
        terminal.addTask(value.id);
        if (value.completed) terminal.completeTask(value.id);
      }

      if (!this._started) {
        terminal.stdout(
          `
 _    ____  ____    _   __    _       ______  ___   ___ 
| |  / / / / / /   / | / /   | |     / / __ \\/   | |__ \\
| | / / / / / /   /  |/ /____| | /| / / /_/ / /| | __/ /
| |/ / /_/ / /___/ /|  /_____/ |/ |/ / ____/ ___ |/ __/ 
|___/\\____/_____/_/ |_/      |__/|__/_/   /_/  |_/____/ `,
          "pre",
          "stdout-banner"
        );
        terminal.stdout(`
        Welcome to VULN-WPA2 :)<br>
        <br>
        This website tries to simulate a real world vulnerability present in the <a class="st-l" target="_blank" href="https://en.wikipedia.org/wiki/Wi-Fi_Protected_Access">WI-FI Protected Access II (WPA2)</a> security certification program. Your objective is to obtain the password of the <span class="st-r">WIFI-28D</span> network. To achieve this, you will have to complete each of the tasks specified in the right panel. When you manage to get the password, try to authenticate yourself on the network to verify that it is correct. If you don't know where to start, you can start by looking at the methodology page. There you'll learn all the necessary terminology and steps to complete all the tasks.<br>
        <br>
        Although I try to make it as realistic as possible, the page is not focused on being 100% realistic. Take it as an introductory experience.
        <br><br>
        * Progress is automatically saved, so don't worry if you have to take a break and continue later. ;)<br>
        <br>
        * You can see your previous commands with the UP and DOWN arrow keys (it's gonna be really helpful).<br>
        <br>
        Type "<span class="st-r">commands</span>" to see the available commands.<br>

      `);

        // Randomize data
        let wirelessInterface;
        if (
          terminal.interfaces.some((element) => {
            if (element.isWireless) {
              wirelessInterface = element;
              return true;
            }
          })
        ) {
          for (const [_, value] of Object.entries(wirelessInterface.networks)) {
            value.bssid = this.genMAC();
            value.channel = String(this.randomNumber(11, 1));
            value.password =
              terminal.files["wordlist.txt"].value[
                this.randomNumber(
                  terminal.files["wordlist.txt"].value.length,
                  0
                )
              ];
          }
        }
      }
    }
  }
  app = new App();
}

export { app };
