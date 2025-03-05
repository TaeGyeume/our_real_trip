// import React from 'react';

// const MileageHistory = ({history}) => {
//   if (!history || history.length === 0) {
//     return <p className="text-center text-gray-500">📭 마일리지 내역이 없습니다.</p>;
//   }

//   return (
//     <div className="bg-gray-100 p-4 rounded-lg shadow">
//       <h2 className="text-xl font-bold mb-2">📜 마일리지 내역</h2>
//       <ul className="divide-y divide-gray-300">
//         {history.map((item, index) => (
//           <li key={index} className="py-2">
//             <p className="text-sm text-gray-600">{item.createdAt}</p>
//             <p className="text-lg font-medium">{item.description}</p>
//             <p
//               className={`text-lg ${item.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
//               {item.amount > 0 ? `+${item.amount}` : item.amount} 점
//             </p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default MileageHistory;

import React from 'react';
import {Box, Paper, Typography, List, ListItem, Divider} from '@mui/material';

const MileageHistory = ({history}) => {
  if (!history || history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{mt: 2}}>
        📭 마일리지 내역이 없습니다.
      </Typography>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        backgroundColor: 'grey.100',
        borderRadius: 2
      }}>
      <Typography variant="h6" sx={{mb: 2, fontWeight: 'bold'}}>
        📜 마일리지 내역
      </Typography>

      <List sx={{p: 0}}>
        {history.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start" sx={{display: 'block', py: 1}}>
              {/* 날짜 */}
              <Typography variant="caption" color="text.secondary">
                {item.createdAt}
              </Typography>
              {/* 설명 */}
              <Typography variant="body1" sx={{fontWeight: 'medium'}}>
                {item.description}
              </Typography>
              {/* 점수 */}
              <Typography
                variant="body1"
                sx={{
                  color: item.amount > 0 ? 'success.main' : 'error.main',
                  fontWeight: 'bold'
                }}>
                {item.amount > 0 ? `+${item.amount}` : item.amount} 점
              </Typography>
            </ListItem>
            {index < history.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default MileageHistory;
