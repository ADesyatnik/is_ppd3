import React from 'react';

export default function ListComponents({ data }) {
  return data && <div className="components list">{data && <code>{data}</code>}</div>;
}
