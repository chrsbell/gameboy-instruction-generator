const fs = require("fs");
const path = require("path");
const instructions = require("./instructions");

/**
 * 16-bit add/subtract with carry
 */
let docs = {
  SBC: `
  /**
   * Subtract with carry flag.
   */`,
  JP: `
  /**
   * Unconditional jump to the absolute address specified by the 16-bit operand
   */`,
  POP: `
  /**
   * Pops to the 16-bit register, data from the stack memory.
   */`,
  PUSH: `
  /**
   * Push to the stack memory, data from the 16-bit register.
   */`,
  LD: `
  /**
   * Load data into the register.
   */`,
  SUB: `
   /**
    * Subtract.
    */`,
  ADC: `
   /**
    * Add with carry flag.
    */`,
  ADD: `
  /**
   * Add.
   */`,
  NOP: `
  /**
   * No operation.
   */`,
  AND: `
  /**
   * Logical AND.
   */`,
  OR: `
  /**
   * Logical OR.
   */`,
  SWAP: `
   /**
    * Swap upper and lower nibbles.
    */`,
  JR: `
  /**
   * Unconditional jump to the relative address.
   */`,
  CALL: `
  /**
   * Function call to the absolute address.
   */`,
  RET: `
  /**
   * Return from a function.
   */`,
};

const makeFuncName = (op1, op2, mnemonic, operands) => {
  if (!operands.length) {
    return mnemonic;
  }
  let opcode = `${mnemonic}_${op1}_`;
  const makeOperand = (i) => {
    let operand = operands[i];
    let str = "";
    // console.log(mnemonic, operand);
    str += operand.name;
    if (operand.increment) {
      str += "_incr";
    } else if (operand.decrement) {
      str += "_decr";
    }
    if (operand.immediate) {
      // load value from registers
      str += "_i";
    } else {
      // read values from memory
      str += "_m";
    }
    return str;
  };
  if (operands.length === 1) {
    if (mnemonic === "PUSH" || mnemonic === "POP") {
      opcode += `SP_`;
      opcode += `${op2}_`;
      opcode += makeOperand(0);
    } else if (mnemonic === "SWAP") {
      opcode += `${op2}_`;
      opcode += makeOperand(0);
    } else {
      // use default accumulator register
      opcode += `A_i`;
      opcode += `${op2}_`;
      opcode += makeOperand(0);
    }
  } else {
    opcode += makeOperand(0);
    opcode += `_${op2}_`;
    opcode += makeOperand(1);
  }
  return opcode;
};

const main = () => {
  let opcodes = `const z80 = {`;
  let map = `const map = {`;
  for (let key in instructions.unprefixed) {
    const { mnemonic, cycles, operands } = instructions.unprefixed[key];
    let opcode;
    if (mnemonic === "SWAP") {
      console.log("jdaslkd");
    }
    switch (mnemonic) {
      case "ADD":
      case "ADC":
      case "LD":
        opcode = makeFuncName("into", "from", mnemonic, operands);
        break;
      case "SUB":
      case "SBC":
        opcode = makeFuncName("from", "value", mnemonic, operands);
        break;
      case "NOP":
        opcode = "NOP";
        break;
      case "POP":
        opcode = makeFuncName("off", "into", mnemonic, operands);
        break;
      case "PUSH":
        opcode = makeFuncName("onto", "register", mnemonic, operands);
        break;
      case "AND":
      case "OR":
      case "SWAP":
        opcode = makeFuncName("with", "", mnemonic, operands);
        break;
      case "JP":
      case "JR":
      case "RET":
        opcode = makeFuncName("to", "", mnemonic, operands);
        break;
      case "CALL":
        opcode = makeFuncName("to", "from", mnemonic, operands);
        break;
      default:
        break;
    }
    if (opcode) {
      opcodes += `
      ${docs[mnemonic]}
      ${opcode}: (): number => {
        return ${cycles.slice(0)};
      },`;
      map += `${key}: z80.${opcode},\n`;
    }
  }
  opcodes += "}\n";
  map += "}";
  fs.writeFileSync(path.join(__dirname, "generated", "z80.ts"), opcodes + map);
};

main();
