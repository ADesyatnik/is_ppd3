/* eslint-disable no-undef */
import React from 'react';
import { v4 as uuid } from 'uuid';

export default function Matrix({ renderMatrix }) {
  if (!renderMatrix) {
    return null;
  }

  const renderMatrixBody = renderMatrix?._data.map((row) => {
    return (
      <tr key={uuid()}>
        {row.map((cell) => (
          <th key={uuid()}>{cell}</th>
        ))}
      </tr>
    );
  });

  return (
    <div>
      {renderMatrix && (
        <table className="table-matrix">
          <tbody>{renderMatrixBody}</tbody>
        </table>
      )}
    </div>
  );
}