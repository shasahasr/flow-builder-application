import React from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * Props for the MultipleHandles component
 */
interface MultipleHandlesProps {
  /** Allow connections to be made to these handles */
  isConnectable?: boolean;
  /** Include input handles (target) */
  inputs?: boolean;
  /** Include output handles (source) */
  outputs?: boolean;
  /** Custom positions for input handles (default: top) */
  inputPositions?: Position[];
  /** Custom positions for output handles (default: bottom, left, right) */
  outputPositions?: Position[];
  /** Base style for handles */
  handleStyle?: React.CSSProperties;
}

/**
 * A component that provides multiple connection handles to a node
 * Can be used inside any node component to quickly add multiple handles
 */
export const MultipleHandles: React.FC<MultipleHandlesProps> = ({
  isConnectable = true,
  inputs = true,
  outputs = true,
  inputPositions = [Position.Top],
  outputPositions = [Position.Bottom, Position.Left, Position.Right],
  handleStyle = {},
}) => {
  return (
    <>
      {/* Input handles */}
      {inputs &&
        inputPositions.map((position, i) => (
          <Handle
            key={`input-${position}-${i}`}
            type="target"
            id={`handle-input-${position.toLowerCase()}`}
            position={position}
            style={{ ...handleStyle }}
            isConnectable={isConnectable}
          />
        ))}

      {/* Output handles */}
      {outputs &&
        outputPositions.map((position, i) => (
          <Handle
            key={`output-${position}-${i}`}
            type="source"
            id={`handle-output-${position.toLowerCase()}`}
            position={position}
            style={{ ...handleStyle }}
            isConnectable={isConnectable}
          />
        ))}
    </>
  );
};

/**
 * A utility function to get the appropriate handle ID for a specific position
 * @param isInput Whether this is for an input (target) or output (source) handle
 * @param position The position of the handle (Position enum)
 * @returns The handle ID to use
 */
export const getHandleId = (isInput: boolean, position: Position): string => {
  const type = isInput ? "input" : "output";
  const positionName = position.toLowerCase();
  return `handle-${type}-${positionName}`;
};

export default MultipleHandles;
