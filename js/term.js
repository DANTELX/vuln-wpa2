import { app } from "./main.js";
import { DOMElements } from "./dom.js";
import { column } from "./column.js";

class Terminal {
  constructor({ prompt, interfaces, files, helpData, tasksData }) {
    this.prompt = prompt;
    this.interfaces = interfaces;
    this.files = files;
    this.helpData = helpData;
    this.tasksData = tasksData;
    this.tasksDataKeys = Object.keys(tasksData);
    this.commands = [
      "iwconfig",
      "wpacrack",
      "ls",
      "cat",
      "clear",
      "help",
      "commands",
      "restart",
    ];
    this.termHistory = [""];
    this.termHistoryPosition = 0;
    this.stopExecution = false;
  }

  stdout(msg, HTMLTag = "p", HTMLClass = "stdout") {
    const html = `
      <${HTMLTag} class="${HTMLClass}">${msg}</${HTMLTag}>
    `;
    DOMElements.termHistoryEl.insertAdjacentHTML("beforeend", html);
  }

  // Tasks methods
  addTask(id) {
    let html;
    html = `
      <p class="task-item" id="${this.tasksData[id].id}"><span class="task-uncompleted">[ ]</span><span class="task-completed hidden">[*]</span> ${this.tasksData[id].description}</p>
    `;
    DOMElements.taskListEl.insertAdjacentHTML("beforeend", html);
  }

  completeTask(id) {
    // Return if the id doesn't exists
    if (!this.tasksData[id]) return;

    document
      .querySelector(`#${id} span.task-completed`)
      .classList.remove("hidden");
    document
      .querySelector(`#${id} span.task-uncompleted`)
      .classList.add("hidden");

    this.tasksData[id].completed = true;
  }

  addFile(fileName, HTMLValue, value, fileType) {
    if (this.files[fileName]) return;
    this.files = Object.defineProperties(this.files, {
      [fileName]: {
        value: {
          fileName: fileName,
          fileType: fileType,
          HTMLValue: HTMLValue,
          value: value,
        },
        enumerable: true,
      },
    });
  }

  executecmd(input) {
    DOMElements.termHistoryEl.insertAdjacentHTML(
      "beforeend",
      `<p class='prompt-history'>${terminal.prompt} ${input}</p>`
    );
    if (!(input === this.termHistory[1])) {
      this.termHistory = this.termHistory
        .slice(0, 1)
        .concat([input].concat(...this.termHistory.slice(1)));
    }
    this.termHistoryPosition = 0;
    DOMElements.promptInputEl.value = "";

    input = input.toLowerCase();
    const cmd = input.split(" ")[0];
    const opts = input.split(" ").slice(1).join(" ");
    switch (cmd) {
      case "clear":
        app.removeAllChildNodes(DOMElements.termHistoryEl);
        break;

      case "iwconfig":
        this._iwconfig(opts);
        break;

      case "wpacrack":
        this._wpacrack(opts);
        break;

      case "ls":
        this._ls();
        break;

      case "cat":
        this._cat(opts);
        break;

      case "help":
        this._help(opts);
        break;

      case "commands":
        this._commands();
        break;

      case "restart":
        app._clearLocalStorage();
        break;

      default:
        terminal.stdout(
          `"${cmd}" is not a valid command. Type "<span class="st-r">commands</span>" to see the available commands`
        );
        break;
    }
    if (this.stopExecution) {
      DOMElements.promptEl.classList.add("hidden");
    }
  }

  stopCmdExecution(callback, seconds, callbackBefore) {
    this.stopExecution = true;
    if (callbackBefore) callbackBefore();
    setTimeout(() => {
      callback();
      DOMElements.promptEl.classList.remove("hidden");
      this._scrollToBottom();
      this.stopExecution = false;
    }, seconds * 1000);
  }

  _scrollToBottom() {
    DOMElements.termEl.scrollTo({
      top: DOMElements.termHistoryEl.clientHeight,
      behavior: "smooth",
    });
  }

  _getOpts(opts) {
    opts = opts.trim().replace(/\s+/g, " ");
    if (opts === "") return;
    const optsArray = [];
    const optsSplit = opts.split(" ");
    optsSplit.forEach((_, index) => {
      if (index % 2 === 0) {
        optsArray.push([optsSplit[index], optsSplit[index + 1]]);
      }
    });
    return optsArray;
  }

  _iwconfig(opts) {
    opts = opts.trim().replace(/\s+/g, " ");
    const optionInterface = opts.split(" ").slice(0, 1).join("");
    opts = this._getOpts(opts.split(" ").slice(1).join(" "));
    // Defaut behaviour when no options or arguments are given
    if (!optionInterface) {
      let msgTemp = "";
      msgTemp += `%pdINTERFACEpd%%pdSTATUSpd%%nl`;
      terminal.interfaces.forEach((element) => {
        const msg = element.isWireless
          ? `mode: ${element.currentMode}`
          : "no wireless extensions.";
        msgTemp += `%pd${element.name}pd%${msg}%nl`;
      });
      terminal.stdout(column(msgTemp));
      return;
    }
    // Check if first argument is a valid interface
    let validInterface;
    terminal.interfaces.some((element, index) => {
      return element.name === optionInterface
        ? (validInterface = index)
        : false;
    });

    if (validInterface === undefined) {
      terminal.stdout(`${optionInterface} is not a valid interface.`);
      return;
    }

    // Display information about a specific interface
    if (validInterface !== false && !opts) {
      const msg = terminal.interfaces[validInterface].isWireless
        ? `Mode: ${terminal.interfaces[validInterface].currentMode}`
        : "no wireless extensions.";
      terminal.stdout(
        column(`
      %pdINTERFACEpd%%pdSTATUSpd%%nl
      %pd${terminal.interfaces[validInterface].name}pd%${msg}%nl`)
      );
      return;
    }

    // examine if all options exist
    let avaliableCommands = ["mode"];
    let invalidOption;
    if (
      !opts.every((opt) => {
        return avaliableCommands.some((element) => {
          if (element === opt[0]) {
            return true;
          } else {
            invalidOption = opt[0];
            return false;
          }
        });
      })
    ) {
      terminal.stdout(`"${invalidOption}" is not a valid option.`);
      return;
    }

    // execute command with given options and arguments
    let ignoreOptions = false;
    opts.forEach((opt) => {
      if (ignoreOptions) return;
      const option = opt[0];
      const argument = opt[1];

      if (!argument) {
        terminal.stdout(`You have to specify a mode.`);
        return;
      }

      switch (option) {
        // OPTION MODE
        case "mode":
          if (!terminal.interfaces[validInterface].isWireless) {
            terminal.stdout(
              `"${terminal.interfaces[validInterface].name}" is not a wireless interface.`
            );
            ignoreOptions = true;
            break;
          }

          if (
            !terminal.interfaces[validInterface].modes.some((element) => {
              return argument === element.toLowerCase();
            })
          ) {
            terminal.stdout(`"${argument}" is not a valid mode.`);
            ignoreOptions = true;
            break;
          }

          terminal.interfaces[validInterface].currentMode = argument;
          terminal.stdout(
            column(`
            %pdINTERFACEpd%%pdMODEpd%%nl
            %pd${terminal.interfaces[validInterface].name}pd%%pd${argument}pd%%nl`)
          );
          if (argument === "monitor") terminal.completeTask("task1");
          ignoreOptions = true;
          break;
      }
    });
  }

  _wpacrack(opts) {
    opts = opts.trim().replace(/\s+/g, " ");
    let validInterface;
    if (
      !terminal.interfaces.some((element) => {
        if (element.isWireless) {
          validInterface = element;
          return true;
        }
      })
    ) {
      terminal.stdout(`wpacrack: there are not wireless interfaces available`);
      return;
    } else {
      if (!(validInterface.currentMode === "monitor")) {
        terminal.stdout(
          `wpacrack: ${validInterface.name} interface is not configured properly`
        );
        return;
      }
    }

    if (!opts) {
      terminal.stdout(`
        No options provided. Type "<span class="st-r">help wpacrack</span>" to see the available options 
      `);
      return;
    }

    const cmdMode = opts.split(" ").slice(0, 1).join("");
    opts = this._getOpts(opts.split(" ").slice(1).join(" "));

    terminal.stdout(`[Using ${validInterface.name} interface]`);

    switch (cmdMode) {
      case "kill":
        if (!validInterface.processes) {
          terminal.stdout(`wpacrack: There are not confilicting process`);
          return;
        }

        validInterface.processes = false;
        let randomProcesses = "";
        for (let i = 0; i < app.randomNumber(5, 1); i++) {
          randomProcesses += `%pd${app.randomNumber(400)}pd%process ${
            i + 1
          }%nl`;
        }
        terminal.stdout(`
        Killing these processes:<br><br>
        ${column(`%pdPIDpd%Name%nl${randomProcesses}`)}
        `);
        break;
      case "networks":
        if (validInterface.processes) {
          terminal.stdout(
            `wpacrack: There are some conflicting processes that prevent the execution of the command`
          );
          return;
        }

        let msg = "";
        for (const [key, value] of Object.entries(validInterface.networks)) {
          msg += `%pd${value.bssid}pd%%pd# ${value.channel}pd%%pd${value.encryption}pd%%pd${value.authentication}pd%${value.essid}%nl`;
        }
        terminal.stdout(
          column("%pdBSSIDpd%%pdCHpd%%pdENCpd%%pdAUTHpd%ESSID<br>%nl" + msg)
        );
        terminal.completeTask("task2");
        break;
      case "capture":
        if (validInterface.processes) {
          terminal.stdout(
            `wpacrack: There are some conflicting processes that prevent the execution of the command`
          );
          return;
        }

        if (!opts) {
          terminal.stdout(
            `wpacrack: there are some non-optional options that need to be provided`
          );
          return;
        }

        let captureOptions = {};
        for (const opt of opts) {
          const option = opt[0];
          const argument = opt[1];
          const captureExpected = ["-b", "-c", "-d"];

          if (
            !captureExpected.some((element) => {
              return element === option;
            })
          ) {
            terminal.stdout(`wpacrack: option "${option}" is not expected`);
            return;
          }

          if (!argument) {
            terminal.stdout(`wpacrack: missing argument in option ${option}`);
            return;
          }

          if (argument.at(0) === "-") {
            terminal.stdout(`wpacrack: wrong argument in option ${option}`);
            return;
          }

          if (
            captureExpected.some((element) => {
              return element === option;
            })
          ) {
            if (captureOptions[option.at(-1)]) {
              terminal.stdout(`wpacrack: ${option} can not be defined twice`);
              return;
            }
            captureOptions = Object.defineProperties(captureOptions, {
              [option.at(-1)]: {
                value: argument,
              },
            });
          }
        }

        if (!captureOptions.b) {
          terminal.stdout(`wpacrack: missing -b option`);
          return;
        }

        if (!captureOptions.c) {
          terminal.stdout(`wpacrack: missing -c option`);
          return;
        }

        let validChannel;
        let validBssid;
        let selectedNetwork;
        for (const [_, value] of Object.entries(validInterface.networks)) {
          if (value.bssid === captureOptions.b) {
            validBssid = true;
            selectedNetwork = value;
          }
          if (
            captureOptions.b === value.bssid &&
            captureOptions.c === value.channel
          ) {
            validChannel = true;
          }
        }

        if (!(validBssid && validChannel)) {
          terminal.stdout(
            `wpacrack: no available wireless network with BSSID:${captureOptions.b} and CH:${captureOptions.c}`
          );
          return;
        }

        if (captureOptions.d) {
          if (!(captureOptions.d === "true" || captureOptions.d === "false")) {
            terminal.stdout(
              `wpacrack: -d option argument is a boolean (true|false)`
            );
            return;
          }
        }

        let authTime =
          captureOptions.d === "true"
            ? app.randomNumber(10, 5)
            : app.randomNumber(30, 20);
        let interval;
        const currentDate = new Date().toDateString();
        let timer = 0;
        let deauthMsg = "";
        let interfaceMsg = column(
          `%pdBSSIDpd%%pdCHpd%%pdENCpd%%pdAUTHpd%ESSID<br>%nl` +
            `%pd${selectedNetwork.bssid}pd%%pd#${selectedNetwork.channel}pd%%pd${selectedNetwork.encryption}pd%%pd${selectedNetwork.authentication}pd%${selectedNetwork.essid}%nl`
        );

        if (captureOptions.d === "true")
          deauthMsg = `[<span class="st-r">deauth</span>]`;
        terminal.stdout(
          `[CH ${captureOptions.c}][time elepsed: ${timer}s][Date: ${currentDate}]${deauthMsg}<br><br> ${interfaceMsg}<br>`
        );
        this.stopCmdExecution(
          () => {
            let fileName =
              `${selectedNetwork.essid}_handshake.cap`.toLowerCase();
            terminal.stdout(
              `[WPA handshake: ${selectedNetwork.bssid}] File saved as <span class="st-r">${fileName}</span>`
            );
            this.addFile(fileName, false, selectedNetwork, "packetCapture");
            terminal.completeTask("task3");
          },
          authTime,
          () => {
            interval = setInterval(() => {
              timer++;
              DOMElements.termHistoryEl.removeChild(
                DOMElements.termHistoryEl.lastElementChild
              );
              terminal.stdout(
                `[CH ${captureOptions.c}][time elepsed: ${timer}s][Date: ${currentDate}]${deauthMsg}<br><br>${interfaceMsg}`
              );
            }, 1 * 1000);

            setTimeout(() => {
              clearInterval(interval);
              terminal.stdout(`@ Client authenticated<br>`);
              this._scrollToBottom();
            }, (authTime - 1) * 1000);
          }
        );
        break;

      case "crack":
        if (validInterface.processes) {
          terminal.stdout(
            `wpacrack: There are some conflicting processes that prevent the execution of the command`
          );
          return;
        }

        if (!opts) {
          terminal.stdout(
            `wpacrack: there are some non-optional options that need to be provided`
          );
          return;
        }

        let crackOptions = {};
        for (const opt of opts) {
          const option = opt[0];
          const argument = opt[1];
          const crackExpected = ["-f", "-w"];

          if (
            !crackExpected.some((element) => {
              return element === option;
            })
          ) {
            terminal.stdout(`wpacrack: option "${option}" is not expected`);
            return;
          }

          if (argument.at(0) === "-") {
            terminal.stdout(`wpacrack: wrong argument in option ${option}`);
            return;
          }

          if (!argument) {
            terminal.stdout(`wpacrack: missing argument in option ${option}`);
            return;
          }

          if (
            crackExpected.some((element) => {
              return element === option;
            })
          ) {
            if (crackOptions[option.at(-1)]) {
              terminal.stdout(`wpacrack: ${option} can not be defined twice`);
              return;
            }
            crackOptions = Object.defineProperties(crackOptions, {
              [option.at(-1)]: {
                value: argument,
              },
            });
          }
        }

        if (!crackOptions.f) {
          terminal.stdout(`wpacrack: missing -f option`);
          return;
        }

        if (!crackOptions.w) {
          terminal.stdout(`wpacrack: missing -w option`);
          return;
        }

        let selectedWordlist;
        let selectedFile;
        for (const [key, value] of Object.entries(this.files)) {
          if (key === crackOptions.w) {
            selectedWordlist = value;
          }
          if (key === crackOptions.f) {
            selectedFile = value;
          }
        }

        if (!selectedFile) {
          terminal.stdout(`wpacrack: "${crackOptions.f}" file does not exists`);
          return;
        }

        if (!selectedWordlist) {
          terminal.stdout(`wpacrack: "${crackOptions.w}" file does not exists`);
          return;
        }

        if (!(selectedFile.fileType === "packetCapture")) {
          terminal.stdout(
            `wpacrack: ${selectedFile.fileName} is not a supported file for option -f`
          );
          return;
        }

        if (!(selectedWordlist.fileType === "wordlist")) {
          terminal.stdout(
            `wpacrack: ${selectedWordlist.fileName} is not a valid wordlist for option -w`
          );
          return;
        }

        let crackTime =
          selectedWordlist.value.findIndex((element) => {
            return selectedFile.value.password === element;
          }) + 2;
        crackTime = (crackTime * 250) / 1000;
        let crackTimer = 0;
        let passNumber = 0;
        let updatePassNumber;
        let updateTimer;

        terminal.stdout(
          `wordlist: ${selectedWordlist.fileName}<br>
          [${selectedFile.fileName}][${crackTimer}s] ${passNumber}/${selectedWordlist.value.length} keys tested`
        );

        this.stopCmdExecution(
          () => {
            let fileName =
              `${selectedFile.value.essid}_password.txt`.toLowerCase();
            terminal.stdout(
              `KEY FOUND! [ <span class='st-r'>${fileName}</span> ] Password file saved`
            );
            this.addFile(
              fileName,
              `ESSID: ${selectedFile.value.essid}<br>
              BSSID: ${selectedFile.value.bssid}<br>
              CHANNEL: ${selectedFile.value.channel}<br>
              PASSWORD: <span class="st-r">${selectedFile.value.password}</span><br>`,
              undefined,
              "plainText"
            );
            clearInterval(updatePassNumber);
            clearInterval(updateTimer);
            terminal.completeTask("task4");
          },
          crackTime,
          () => {
            updateTimer = setInterval(() => {
              crackTimer++;
              DOMElements.termHistoryEl.removeChild(
                DOMElements.termHistoryEl.lastElementChild
              );
              terminal.stdout(
                `wordlist: ${selectedWordlist.fileName}<br>
                [${selectedFile.fileName}][${crackTimer}s] ${passNumber}/${selectedWordlist.value.length} keys tested`
              );
            }, 1000);

            updatePassNumber = setInterval(() => {
              passNumber++;
              DOMElements.termHistoryEl.removeChild(
                DOMElements.termHistoryEl.lastElementChild
              );
              terminal.stdout(
                `wordlist: ${selectedWordlist.fileName}<br>
                [${selectedFile.fileName}][${crackTimer}s] ${passNumber}/${selectedWordlist.value.length} keys tested`
              );
            }, 250);
          }
        );

        break;

      default:
        terminal.stdout(`wpacrack: "${cmdMode}" is not a valid option`);
        break;
    }
  }

  _ls() {
    let msg = "";
    for (const [key, _] of Object.entries(this.files)) {
      msg += `${key}<br>`;
    }
    terminal.stdout(msg);
  }

  _cat(opts) {
    opts = opts.trim().replace(/\s+/g, " ");
    let opt = opts.split(" ")[0];

    if (!opt) {
      terminal.stdout(`cat: you need to give a file name as an argument`);
      return;
    }

    let fileValue = "";
    for (const [key, value] of Object.entries(this.files)) {
      if (key === opt) fileValue = value.HTMLValue;
    }

    if (!fileValue) {
      terminal.stdout(`cat: "${opt}" File cannot be opened`);
      return;
    }

    if (!fileValue) {
      terminal.stdout(`cat: "${opt}" No such file`);
      return;
    }
    terminal.stdout(fileValue);
  }

  _help(opts) {
    opts = opts.trim().replace(/\s+/g, " ");
    let opt = opts.split(" ")[0];
    if (!opt) opt = "help";

    if (
      !terminal.commands.some((element) => {
        return element === opt;
      })
    ) {
      terminal.stdout(`No help for ${opt} command`);
      return;
    }

    const helpTemplate = `
      ${opt} - ${this.helpData[opt].whatis}<br>
      <br>
      <span class="st-r">SYNTAX:<br></span>${this.helpData[opt].syntax}<br>
      <br>
      <span class="st-r">OPTIONS:<br></span>${this.helpData[opt].options}<br>
      <br>
      <span class="st-r">EXAMPLES:<br></span>${this.helpData[opt].example}<br>`;

    terminal.stdout(helpTemplate);
  }

  _commands() {
    let textTemp = "";
    terminal.commands.forEach((element) => {
      textTemp += `%pd${element}pd%${this.helpData[element].whatis}%nl`;
    });
    terminal.stdout(`
      <span class='st-r'>AVALIABLE COMMANDS:</span><br><br>
      ${column(`
        %pdCOMMANDpd%DESCRIPTION%nl
        ${textTemp}`)}
    `);
  }
}

let terminal;
try {
  const helpFetch = await fetch("./js/help.json");
  const tasksFetch = await fetch("./js/tasks.json");
  const wordListFetch = await fetch("./js/wordlist.json");
  const wordList = await wordListFetch.json();

  let wordListText = "";
  wordList.words.forEach((word) => {
    wordListText += `${word}<br>`;
  });

  terminal = new Terminal({
    prompt: "~ $",
    interfaces: [
      {
        name: "lo",
      },
      {
        name: "eth0",
      },
      {
        name: "wlan0",
        isWireless: true,
        currentMode: "managed",
        modes: ["managed", "monitor"],
        processes: true,
        networks: {
          network1: {
            bssid: "",
            essid: "WIFi-28D",
            channel: "",
            encryption: "WPA2",
            authentication: "PSK",
            password: "",
          },
          network2: {
            bssid: "",
            essid: "WIFi-02A",
            channel: "",
            encryption: "WPA2",
            authentication: "PSK",
            password: "",
          },
          network3: {
            bssid: "",
            essid: "WIFi-95S",
            channel: "",
            encryption: "WPA2",
            authentication: "PSK",
            password: "",
          },
        },
      },
    ],
    files: {
      "wordlist.txt": {
        fileName: "wordlist.txt",
        fileType: "wordlist",
        HTMLValue: wordListText,
        value: wordList.words,
      },
    },
    helpData: await helpFetch.json(),
    tasksData: await tasksFetch.json(),
  });
} catch (error) {
  location = `${location.protocol}//${location.host}/error.html`;
}

export { terminal };
