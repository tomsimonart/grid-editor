export const blocks = (page) => ({
  Function: {
    Function: {
      block: page.getByText("Function").nth(1),
      elements: {
        Function: page.locator("#cfg-0"),
        input: page.locator(".view-line"),
        End: page.locator("#cfg-1"),
      },
    },
  },
  variables: {
    Lookup: {
      block: page.getByText("Lookup"),
      elements: {
        source: page.getByPlaceholder("Incoming value to match"),
        input: page.getByPlaceholder("input").first(),
        output: page.getByPlaceholder("output").first(),
        destination: page.getByPlaceholder("Variable name to load the"),
        addNewPair: page.getByText("Add new pair..."),
      },
    },
    Global: {
      block: page.getByText("Global"),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        var: page.getByPlaceholder("variable name"),
        i: page.locator("#monaco_container"),
        addNewPair: page.getByText("Add global variable..."),
      },
    },
    Locals: {
      block: page.getByText("Locals"),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        var: page.getByPlaceholder("variable name"),
        i: page.locator("#monaco_container"),
        addNewPair: page.getByText("Add local variable..."),
      },
    },
    Self: {
      block: page.getByText("Self"),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        var: page.getByPlaceholder("variable name"),
        i: page.locator("#monaco_container"),
        addNewPair: page.getByText("Add self variable..."),
      },
    },
  },
  led: {
    "Start Animation": {
      block: page.getByText("Start Animation"),
      elements: {
        ledNumber: page.getByLabel("LED Number"),
        Layer: page.getByLabel("Layer"),
        Phase: page.getByLabel("Phase"),
        Rate: page.getByLabel("Rate"),
        Shape: page.getByLabel("Shape"),
      },
    },
    "Stop Animation": {
      block: page.getByText("Stop Animation"),
      elements: {
        ledNumber: page.getByLabel("LED Number"),
        Layer: page.getByLabel("Layer"),
      },
    },
    Color: {
      block: page.getByText("Color"),
      elements: {
        ledNumber: page.getByLabel("LED Number"),
        Layer: page.getByLabel("Layer"),
        Red: page.getByLabel("Red"),
        Green: page.getByLabel("Green"),
        Blue: page.getByLabel("Blue"),
        Canva: page.locator("#myCanvas"),
        Random: page.locator(".w-1\\/5"),
        Beauty: page.locator("#cfg-0").getByRole("checkbox"),
      },
    },
    Intensity: {
      block: page.getByText("Intensity"),
      elements: {
        "LED Number": page.getByLabel("LED Number"),
        Layer: page.getByLabel("Layer"),
        Intensity: page.getByLabel("Intensity"),
      },
    },
  },
  midi: {
    MIDI: {
      block: page.getByText("MIDI", { exact: true }),
      elements: {
        Channel: page.getByLabel("Channel"),
        Command: page.getByLabel("Command"),
        Parameter1: page.getByLabel("Parameter 1"),
        Parameter2: page.getByLabel("Parameter 2"),
      },
    },
    "MIDI 14": {
      block: page.getByText("MIDI 14"),
      elements: {
        Channel: page.getByLabel("Channel"),
        CC: page.getByLabel("CC Number"),
        "Controller Value": page.getByLabel("Controller Value"),
      },
    },
    "MIDI SysEX": {
      block: page.getByText("MIDI SysEX"),
      elements: {
        Commit: page.getByRole("button", { name: "Commit" }),
        message: page.getByText("0xF0, 0x41, 0x10, val, 0xF7", { exact: true }),
      },
    },
    "MIDI NRPN": {
      block: page.getByText("MIDI NRPN"),
      elements: {
        Channel: page.getByLabel("Channel"),
        MSB: page.getByLabel("MSB"),
        LSB: page.getByLabel("LSB"),
        "NRPN CC": page.getByLabel("NRPN CC"),
        Value: page.getByLabel("Value"),
        "14bit Resolution": page.getByLabel("14bit Resolution"),
      },
    },
  },
  hid: {
    "GamePad Axis": {
      block: page.getByText("GamePad Axis"),
      elements: {
        Axis: page.getByLabel("Axis"),
        Position: page.getByLabel("Position"),
      },
    },
    "GamePad Button": {
      block: page.getByText("GamePad Button"),
      elements: {
        Button: page.getByRole("combobox", { name: "Button" }),
        State: page.getByLabel("State"),
      },
    },
    Keyboard: {
      block: page.getByText("Keyboard"),
      elements: {
        Macro: page.locator(".focus\\:border-select-desaturate-20"),
        "Add Key": page.getByRole("combobox").nth(3),
        "Delay Key": page.getByRole("spinbutton").first(),
        "Add Delay": page.getByRole("button", { name: "Add Delay" }),
        "Default Delay": page.getByRole("spinbutton").nth(1),
        "Clear All": page.getByRole("button", { name: "Clear All" }),
      },
    },
    "Mouse Button": {
      block: page.getByText("Mouse Button"),
      elements: {
        Button: page.getByRole("combobox", { name: "Button" }),
        State: page.getByLabel("State"),
      },
    },
    "Mouse Move": {
      block: page.getByText("Mouse Move"),
      elements: {
        Axis: page.getByLabel("Axis"),
        Position: page.getByLabel("Position"),
      },
    },
  },
  element: {
    "Button Mode": {
      block: page.getByText("Button Mode"),
      elements: {
        Mode: page.getByLabel("Mode"),
        "Enable Min/Max Value": page.getByLabel("Enable Min/Max Value"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
      },
    },
    "Encoder Mode": {
      block: page.getByText("Encoder Mode"),
      elements: {
        Mode: page.getByLabel("Mode"),
        Velocity: page.getByLabel("Velocity"),
        "Enable Min/Max Value": page.getByLabel("Enable Min/Max Value"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
        "Enable Sensitivity": page.getByLabel("Enable Sensitivity"),
        Sensitivity: page.getByLabel("Sensitivity", { exact: true }),
      },
    },
    "Potmeter Mode": {
      block: page.getByText("Potmeter Mode"),
      elements: {
        Bit: page.getByLabel("Bit"),
        "Enable Min/Max Value": page.getByLabel("Enable Min/Max Value"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
      },
    },
    "Endless Mode": {
      block: page.getByText("Endless Mode"),
      elements: {
        Mode: page.getByLabel("Mode"),
        Velocity: page.getByLabel("Velocity"),
        "Enable Min/Max Value": page.getByLabel("Enable Min/Max Value"),
        Min: page.getByLabel("Min", { exact: true }),
        Max: page.getByLabel("Max", { exact: true }),
        "Enable Sensitivity": page.getByLabel("Enable Sensitivity"),
        Sensitivity: page.getByLabel("Sensitivity", { exact: true }),
      },
    },
  },
  condition: {
    If: {
      block: page.getByText("If"),
      elements: {
        input: page.locator(".view-line"),
        end: page.locator("#cfg-1"),
      },
    },
    Else: {
      block: page.getByText("Else", { exact: true }).first(),
      elements: {
        else: page.locator("#cfg-1"),
      },
    },
    "Else if": {
      block: page.getByText("Else If"),
      elements: {
        input: page.locator("#cfg-1 #monaco_container"),
      },
    },
  },
  loop: {
    "Repeater Loop": {
      block: page.getByText("Repeater Loop"),
      elements: {
        input: page.locator("div").filter({ hasText: /^10$/ }).nth(3),
        times: page.locator("#cfg-0").getByRole("checkbox"),
        end: page.locator("#cfg-1"),
        Variable: page.getByLabel("Variable"),
        Initial: page.getByLabel("Initial"),
        End: page.getByLabel("End"),
        Increment: page.getByLabel("Increment"),
      },
    },
  },
  specialButton: {
    "Press/Release": {
      block: page.getByText("Press/Release"),
      elements: {
        press: page.locator("#cfg-0"),
        release: page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
    "Button Step": {
      block: page.getByText("Button Step"),
      elements: {
        "Button Off": page.locator("#cfg-0"),
        "Step One": page.locator("#cfg-1"),
      },
    },
  },
  specialEncoder: {
    "Left/Right Rotate": {
      block: page.getByText("Left/Right Rotate"),
      elements: {
        left: page.locator("#cfg-0"),
        right: page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
    "Push & Rotate L R": {
      block: page.getByText("Push & Rotate L R"),
      elements: {
        "push left": page.locator("#cfg-0"),
        "push right": page.locator("#cfg-1"),
        "just left": page.locator("#cfg-2"),
        "just right": page.locator("#cfg-3"),
        end: page.locator("#cfg-4"),
      },
    },
    "Push & Rotate": {
      block: page.getByText("Push & Rotate", { exact: true }),
      elements: {
        "push rotate": page.locator("#cfg-0"),
        "just rotate": page.locator("#cfg-1"),
        end: page.locator("#cfg-2"),
      },
    },
  },
  code: {
    "Code Block": {
      block: page.getByText("Code Block"),
      elements: {
        input: page.locator("pre"),
        "Edit Code": page.getByRole("button", { name: "Edit Code" }),
      },
    },
    "Comment Block": {
      block: page.getByText("Comment Block"),
      elements: {
        input: page.getByLabel("Comment"),
      },
    },
    "Element Name": {
      block: page.getByText("N Element Name"),
      elements: {
        input: page.getByLabel("Element Name"),
      },
    },
  },
  timer: {
    "Clock Source": {
      block: page.getByText("Clock Source"),
      elements: {
        "Element Number": page.getByLabel("Element Number"),
        Source: page.getByLabel("Source"),
      },
    },
    Start: {
      block: page.getByText("Start", { exact: true }),
      elements: {
        "Element Number": page.getByLabel("Element Number"),
        Time: page.getByLabel("Time", { exact: true }),
      },
    },
    Stop: {
      block: page.getByText("Stop", { exact: true }),
      elements: {
        "Element Number": page.getByLabel("Element Number"),
      },
    },
  },
});
