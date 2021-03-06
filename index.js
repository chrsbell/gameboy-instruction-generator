const fs = require("fs");
const path = require("path");
const instructions = require("./instructions");

const params = "@param - CPU class.";
const returns = "@returns - Number of system clock ticks used.";
const illegal = `
/**
 * Invalid opcode.`;

let docs = {
  SBC: `
  /**
   * Subtract with carry flag.
   * ${params}
   * ${returns}`,
  JP: `
  /**
   * Unconditional jump to the absolute address specified by the 16-bit operand.
   * ${params}
   * ${returns}`,
  JP_C: `
  /**
   * Conditional jump to the absolute address specified by the 16-bit operand.
   * ${params}
   * ${returns}`,
  POP: `
  /**
   * Pops to the 16-bit register, data from the stack memory.
   * ${params}
   * ${returns}`,
  PUSH: `
  /**
   * Push to the stack memory, data from the 16-bit register.
   * ${params}
   * ${returns}`,
  LD: `
  /**
   * Load data into the register.
   * ${params}
   * ${returns}`,
  LDH: `
  /**
   * Load data into the register.
   * ${params}
   * ${returns}`,
  SUB: `
  /**
   * Subtract.
   * ${params}
   * ${returns}`,
  ADC: `
  /**
   * Add with carry flag.
   * ${params}
   * ${returns}`,
  ADD: `
  /**
   * Add.
   * ${params}
   * ${returns}`,
  NOP: `
  /**
   * No operation.
   * ${params}
   * ${returns}`,
  AND: `
  /**
   * Logical AND.
   * ${params}
   * ${returns}`,
  OR: `
  /**
   * Logical OR.
   * ${params}
   * ${returns}`,
  XOR: `
  /**
  * Logical XOR.
  * ${params}
  * ${returns}`,
  CP: `
  /**
   * Compare A with regiseter.
   * ${params}
   * ${returns}`,
  INC: `
  /**
   * Increment register.
   * ${params}
   * ${returns}`,
  DEC: `
  /**
   * Decrement register.
   * ${params}
   * ${returns}`,
  SWAP: `
  /**
   * Swap upper and lower nibbles.
   * ${params}
   * ${returns}`,
  DAA: `
  /**
   * Decimal adjust register A.
   * ${params}
   * ${returns}`,
  CPL: `
  /**
   * Complement A register. (Flip all bits.)
   * ${params}
   * ${returns}`,
  CCF: `
  /**
   * Complement carry flag.
   * If C flag is set, then reset it.
   * If C flag is reset, then set it.
   * ${params}
   * ${returns}`,
  SCF: `
  /**
   *  Set Carry flag.
   * ${params}
   * ${returns}`,
  HALT: `
  /**
   * Disables interrupt handling.
   * ${params}
   * ${returns}`,
  STOP: `
  /**
   *  Halt CPU & LCD display until button pressed.
   * ${params}
   * ${returns}`,
  JR: `
  /**
   * Unconditional jump to the relative address.
   * ${params}
   * ${returns}`,
  JR_C: `
  /**
   * Conditional jump to the relative address.
   * ${params}
   * ${returns}`,
  CALL: `
  /**
   * Function call to the absolute address.
   * ${params}
   * ${returns}`,
  RST: `
  /**
   * Unconditional function call to the absolute fixed address
   * ${params}
   * ${returns}`,
  RET: `
  /**
   * Return from a function.
   * ${params}
   * ${returns}`,
  RETI: `
  /**
   * Return from a function.
   * ${params}
   * ${returns}`,
  DI: `
  /**
   * Disables interrupt handling.
   * ${params}
   * ${returns}`,
  EI: `
  /**
   * Enables interrupt handling.
   * ${params}
   * ${returns}`,
  RLCA: `
  /**
   * Rotate A left. Old bit 7 to Carry flag.
   * ${params}
   * ${returns}`,
  RLA: `
  /**
   * Rotate A left through Carry flag.
   * ${params}
   * ${returns}`,
  RRCA: `
  /**
   * Rotate A right. Old bit 0 to Carry flag.
   * ${params}
   * ${returns}`,
  RRA: `
  /**
   * Rotate A right through Carry flag.
   * ${params}
   * ${returns}`,
  RLC: `
  /**
   * Rotate n left. Old bit 7 to Carry flag.
   * ${params}
   * ${returns}`,
  RL: `
  /**
   * Rotate n left through Carry flag.
   * ${params}
   * ${returns}`,
  RRC: `
  /**
   * Rotate n right. Old bit 0 to Carry flag.
   * ${params}
   * ${returns}`,
  RR: `
  /**
   * Rotate n right through Carry flag.
   * ${params}
   * ${returns}`,
  SLA: `
  /**
   * Shift n left into Carry. LSB of n set to 0.
   * ${params}
   * ${returns}`,
  SRA: `
  /**
   * Shift n right into Carry. MSB doesn't change.
   * ${params}
   * ${returns}`,
  SRL: `
  /**
   * Shift n right into Carry. MSB set to 0.
   * ${params}
   * ${returns}`,
  BIT: `
  /**
   * Test bit in register
   * ${params}
   * ${returns}`,
  SET: `
  /**
   * Set bit b in register r.
   * ${params}
   * ${returns}`,
  RES: `
  /**
   * Reset bit b in register r.
   * ${params}
   * ${returns}`,
  PREFIX: `
  /**
   * Execute a CB-prefixed instruction.
   * ${params}
   * ${returns}`,
  ILLEGAL_D3: illegal,
  ILLEGAL_DB: illegal,
  ILLEGAL_DD: illegal,
  ILLEGAL_E3: illegal,
  ILLEGAL_E4: illegal,
  ILLEGAL_EB: illegal,
  ILLEGAL_EC: illegal,
  ILLEGAL_ED: illegal,
  ILLEGAL_F4: illegal,
  ILLEGAL_FC: illegal,
  ILLEGAL_FD: illegal,
};

const makeFuncName = (op1, op2, mnemonic, operands) => {
  if (!operands.length) {
    return mnemonic;
  }
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
  let opcode;
  if (operands.length === 1) {
    if (mnemonic === "PUSH" || mnemonic === "POP") {
      opcode = `${mnemonic}_${op1}_SP_${op2}_${makeOperand(0)}`;
    } else if (mnemonic === "SWAP") {
      opcode = `${mnemonic}_${op1}_${op2}_${makeOperand(0)}`;
    } else {
      // use default accumulator register
      opcode = `${mnemonic}_${op1}_A_i_${op2}_${makeOperand(0)}`;
    }
  } else {
    opcode = `${mnemonic}_${op1}_${makeOperand(0)}_${op2}_${makeOperand(1)}`;
  }
  return opcode;
};

const addOpcode = (instructionSet, mapping, opcodes, key) => {
  let { mnemonic, bytes, cycles, operands, flags } = instructionSet[key];
  key = key.toLowerCase();
  let opcode;
  let isConditional = false;
  let immediate = "i";
  if (operands.length && !operands[0].immediate) {
    immediate = "m";
  }

  switch (mnemonic) {
    case "ADD":
    case "ADC":
    case "LD":
    case "LDH":
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
    case "XOR":
    case "CP":
      opcode = `${mnemonic}_A_with_${operands[0].name}_${immediate}`;
      break;
    case "JP":
    case "JR":
      if (operands.length <= 1) {
        opcode = `${mnemonic}_${operands.map((op) => op.name).join("_")}`;
      } else {
        isConditional = true;
        opcode = `${mnemonic}_C_${operands.map((op) => op.name).join("_")}`;
      }
      break;
    case "RET":
      if (!operands.length) {
        opcode = `${mnemonic}`;
      } else {
        isConditional = true;
        opcode = `${mnemonic}_C_${operands[0].name}`;
      }
      break;
    case "RETI":
      opcode = mnemonic;
      break;
    case "CALL":
      if (operands.length <= 1) {
        opcode = mnemonic;
      } else {
        isConditional = true;
        opcode = `${mnemonic}_C_${operands.map((op) => op.name).join("_")}`;
      }
      break;
    case "RST":
      opcode = makeFuncName("to", "from", mnemonic, operands);
      break;
    case "BIT":
      opcode = makeFuncName("test", "of", mnemonic, operands);
      break;
    case "INC":
    case "DEC":
    case "RLC":
    case "RL":
    case "RRC":
    case "RR":
    case "SLA":
    case "SRA":
    case "SRL":
    case "SWAP":
      opcode = `${mnemonic}_${operands[0].name}_${immediate}`;
      break;
    case "DAA":
    case "CPL":
      opcode = `${mnemonic}_A`;
      break;
    case "CCF":
    case "SCF":
    case "STOP":
    case "HALT":
    case "DI":
    case "EI":
    case "RLCA":
    case "RLA":
    case "RRCA":
    case "RRA":
    case "PREFIX":
      opcode = mnemonic;
      break;
    case "SET":
    case "RES":
      opcode = `${mnemonic}_bit${operands[0].name}_of_${operands[1].name}`;
      break;
    default:
      // illegal opcode
      opcode = mnemonic;
      break;
  }
  const flagsAffected = Object.keys(flags).filter((flag) => {
    // console.log(flags[flag]);
    return flags[flag] !== "-";
  });
  if (opcode) {
    if (isConditional) {
      opcodes += `
      ${docs[mnemonic]}
      * Affected flags: ${flagsAffected.join(", ")}
      */
      function ${opcode} (this: CPU): byte {
        let condition: boolean = OpcodeMap['${key}'].call(this);
        if (!condition) {
          return ${cycles[1]};
        }
        return ${cycles[0]};
      };
      `;
    } else {
      opcodes += `
   ${docs[mnemonic]}
   * Affected flags: ${flagsAffected.join(", ")}
   */
   function ${opcode} (this: CPU): byte {
     OpcodeMap['${key}'].call(this);
     return ${cycles.join(" || ")};
   };`;
    }
    mapping += `${key}: ${opcode},\n`;
  }
  return [opcodes, mapping];
};

const main = () => {
  let opcodes = ``;
  let map = `export default {`;
  let cbmap = `const cbOpcodes = {`;
  for (let key in instructions.unprefixed) {
    [opcodes, map] = addOpcode(instructions.unprefixed, map, opcodes, key);
  }
  for (let key in instructions.cbprefixed) {
    [opcodes, cbmap] = addOpcode(instructions.cbprefixed, cbmap, opcodes, key);
  }
  opcodes += "\n";
  map += "}\n";
  cbmap += "}";
  fs.writeFileSync(
    path.join(__dirname, "generated", "z80.ts"),
    `import { OpcodeMap } from './Map';
    import CPU from '../';
    import { byte } from '../../Types';

     ${opcodes}
     ${map}
     ${cbmap}`
  );
};

main();
