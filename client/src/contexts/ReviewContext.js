import React, {createContext, useContext, useState} from 'react';

const ReviewContext = createContext({
  reviewStatus: {},
  setReviewStatus: () => {}
});

export const ReviewProvider = ({children}) => {
  const [reviewStatus, setReviewStatus] = useState({});


  return (
    <ReviewContext.Provider value={{reviewStatus, setReviewStatus}}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviewContext = () => useContext(ReviewContext);
