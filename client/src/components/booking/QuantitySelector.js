import React from 'react';
import {colors, IconButton} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const QuantitySelector = ({count = 0, setCount}) => {
  return (
    <div
      className="quantity-selector"
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        
      <b style={{
        color:'rgb(94, 95, 95)'
      }}>수량</b>

      {/* - 버튼 */}
      <IconButton
        color="primary"
        size="small"
        aria-label="remove"
        onClick={() => setCount(Math.max(0, count - 1))} // 최소값 1
        variant="outlined"
        style={{
          border: '1px solid rgb(128, 182, 240)', // 파란색 테두리
          borderRadius: '50%' // 원형 버튼
        }}>
        <RemoveIcon
          style={{
            color: 'rgb(128, 182, 240)'
          }}
        />
      </IconButton>

      <span className="quantity-count">{count}</span>

      {/* + 버튼 */}
      <IconButton
        color="primary"
        size="small"
        aria-label="add"
        onClick={() => setCount(Math.min(50, count + 1))} // 최대값 50
        variant="outlined"
        style={{
          border: '1px solid rgb(128, 182, 240)', // 파란색 테두리
          borderRadius: '50%' // 원형 버튼
        }}>
        <AddIcon
          style={{
            color: 'rgb(128, 182, 240)'
          }}
        />
      </IconButton>
    </div>
  );
};

export default QuantitySelector;
