import { writable, get } from "svelte/store";
import { getDeviceName } from "../../../runtime/runtime.store";
import { v4 as uuidv4 } from "uuid";

class DeviceInfo {
  constructor(name, dx, dy) {
    this.name = name;
    this.x = dx;
    this.y = dy;
  }
}

class MidiMessage {
  constructor(channel, command, param1, param2, direction) {
    this.channel = channel;
    this.command = {
      name: getCommandName(command),
      value: command,
      short: getCommandShortName(command),
    };

    this.params = {
      p1: {
        name: getParameterNames(command).p1.name,
        short: getParameterNames(command).p1.short,
        value: param1,
      },
      p2: {
        name: getParameterNames(command).p2.name,
        short: getParameterNames(command).p2.short,
        value: param2,
      },
    };

    this.direction = direction;
  }
}

class SysExMessage {
  constructor(channel, direction, raw) {
    this.channel = channel;
    this.direction = direction;
    this.raw = raw;
  }
}

//Lookup table for command HEX values and getter functions

function getCommandName(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.name;
}

function getParameterNames(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.params;
}

function getCommandShortName(cmd_int) {
  let cmd = getCommand(cmd_int);
  return cmd?.short;
}

const cmdLookup = new Map([
  [
    "8",
    {
      name: "Note-off",
      short: "Note-off",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Velocity", short: "Vel." },
      },
    },
  ],
  [
    "9",
    {
      name: "Note-on",
      short: "Note-on",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Velocity", short: "Vel." },
      },
    },
  ],
  [
    "A",
    {
      name: "Aftertouch",
      short: "Aftertouch",
      params: {
        p1: { name: "Note", short: "Note" },
        p2: { name: "Touch", short: "Touch" },
      },
    },
  ],
  [
    "B",
    {
      name: "Continous Control",
      short: "CC",
      params: {
        p1: { name: "Controller Number", short: "Ctrl." },
        p2: { name: "Value", short: "Value" },
      },
    },
  ],
  [
    "C",
    {
      name: "Patch Change",
      short: "Patch",
      params: {
        p1: { name: "Instrument Number", short: "Inst." },
        p2: { name: "N/A", short: "N/A" },
      },
    },
  ],
  [
    "D",
    {
      name: "Channel Pressure",
      short: "Ch. Pressure",
      params: {
        p1: { name: "Pressure", short: "Pressure" },
        p2: { name: "N/A", short: "N/A" },
      },
    },
  ],
  [
    "E",
    {
      name: "Pitch Bend",
      short: "Pitch Bend",
      params: {
        p1: { name: "LSB", short: "LSB" },
        p2: { name: "MSB", short: "MSB" },
      },
    },
  ],
]);

//Musical Notes
export class MusicalNotes {
  static #musNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  static FromInt(int_value) {
    return (
      this.#musNotes[Math.floor(int_value % 12)] +
      (Math.floor(int_value / 12) - 2)
    );
  }
}

//Retrieves an object with all the user friendly naming
function getCommand(int_value) {
  try {
    if (!Number.isInteger(int_value)) throw int_value + " is not an integer.";

    let hex = int_value.toString(16);
    let cmd = cmdLookup.get(hex[0].toUpperCase());

    if (cmd === undefined) throw "Unknown Command (" + int_value + ")";

    return cmd;
  } catch (e) {
    console.log("MIDI message parsing error: " + e);
    return {
      name: "Unknown",
      short: int_value.toString(),
      params: {
        p1: { name: "P1", short: "P1" },
        p2: { name: "P2", short: "P2" },
      },
    };
  }
}

function replaceNRPNMessages(messages) {
  const NRPNCC = [99, 98, 38, 6];

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].data.params.p1.value !== 99) continue;

    const spliceLength = messages[i + 3]?.data.params.p1.value === 38 ? 4 : 3;
    const NRPNMessages = messages.slice(i, i + spliceLength);

    if (
      NRPNMessages.length < spliceLength ||
      !NRPNMessages.every((e) => NRPNCC.includes(e.data.params.p1.value))
    ) {
      continue;
    }

    const [m1, m2, m3, m4] = messages.splice(i, spliceLength);
    m1.data.command.name += " (NRPN)";
    m1.data.command.short += " (NPRN)";
    m1.data.params.p1.value =
      (m1.data.params.p2.value << 7) + m2.data.params.p2.value;
    m1.data.params.p2.value =
      spliceLength === 4
        ? (m3.data.params.p2.value << 7) + m4.data.params.p2.value
        : m3.data.params.p2.value;

    messages.splice(i, 0, m1); // Re-insert modified m1
  }

  return messages;
}

function replaceHighResMidiMessages(messages) {
  for (let i = 0; i < messages.length; i++) {
    const HiResMessages = messages.slice(i, i + 2);

    if (
      HiResMessages.length !== 2 ||
      !HiResMessages.every((e) => e.data.command.short === "CC")
    ) {
      continue;
    }

    const offset_diff =
      HiResMessages[0].data.params.p1.value -
      HiResMessages[1].data.params.p1.value;
    if (offset_diff !== -32) {
      continue;
    }

    // Extract the two messages from the slice
    const [m1, m2] = messages.splice(i, 2);

    // Get the two halves of the high-resolution value
    const upper_value = m1.data.params.p2.value << 7;
    const lower_value = m2.data.params.p2.value;

    // Update display values
    m1.data.command.name += " (14)";
    m1.data.command.short += " (14)";

    // Set the high-resolution message's value
    m1.data.params.p2.value = upper_value + lower_value;

    // Insert the modified message back into the array
    messages.splice(i, 0, m1);
  }

  return messages;
}

function createMidiMonitor(max_length) {
  const store = writable([]);
  return {
    ...store,
    update_midi: (descr) => {
      if (descr.class_name !== "MIDI") return;

      store.update((s) => {
        //Shift store length if max length is reached
        if (s.length >= max_length) {
          s.shift();
        }

        let bc = descr.brc_parameters;
        let cp = descr.class_parameters;

        //Make full MIDI message from raw data (param names, command name, etc.)
        let item = {
          id: uuidv4(),
          data: new MidiMessage(
            cp.CHANNEL,
            cp.COMMAND,
            cp.PARAM1,
            cp.PARAM2,
            descr.class_instr
          ),
          device: new DeviceInfo(getDeviceName(bc.SX, bc.SY), bc.SX, bc.SY),
        };

        UpdateDebugStream(item, "MIDI");
        s = [...s, structuredClone(item)];
        s = replaceNRPNMessages(s);
        s = replaceHighResMidiMessages(s);
        return s;
      });
    },
  };
}

function createSysExMonitor(max_val) {
  const store = writable([]);
  return {
    ...store,
    update_sysex: (descr) => {
      if (descr.class_name !== "MIDISYSEX") return;

      store.update((s) => {
        if (s.length >= max_val) {
          s.shift();
        }

        let bc = descr.brc_parameters;
        let cp = descr.class_parameters;

        let item = {
          id: uuidv4(),
          data: new SysExMessage(cp.CHANNEL, descr.class_instr, descr.raw),
          device: new DeviceInfo(getDeviceName(bc.SX, bc.SY), bc.SX, bc.SY),
        };

        UpdateDebugStream(item, "SYSEX");

        s = [...s, item];
        return s;
      });
    },
  };
}

export const debug_stream = writable([]);

function UpdateDebugStream(item, msg_type) {
  debug_stream.update((items) => {
    if (items.length >= 32) {
      items.shift();
    }

    item.type = msg_type;
    return [...items, item];
  });
}

export const maxMidi = 32;
export const midi_monitor_store = createMidiMonitor(maxMidi);
export const sysex_monitor_store = createSysExMonitor(maxMidi);
