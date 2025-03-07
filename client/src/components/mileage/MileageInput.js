import React, {useState, useEffect} from 'react';

const MileageInput = ({userMileage, totalPrice, discountAmount, onMileageChange}) => {
  const [usedMileage, setUsedMileage] = useState('');
  const [remainingMileage, setRemainingMileage] = useState(userMileage);

  useEffect(() => {
    setRemainingMileage(userMileage - usedMileage);
  }, [usedMileage, userMileage]);

  const maxUsableMileage = Math.min(userMileage || 0, totalPrice - discountAmount);

  const handleMileageChange = e => {
    const inputMileage = Number(e.target.value);
    const validMileage =
      inputMileage > maxUsableMileage ? maxUsableMileage : inputMileage;
    setUsedMileage(validMileage);
    setRemainingMileage(userMileage - validMileage);
    onMileageChange(validMileage);
  };

  const handleUseAllMileage = () => {
    setUsedMileage(maxUsableMileage);
    setRemainingMileage(userMileage - maxUsableMileage);
    onMileageChange(maxUsableMileage);
  };

  return (
    <div className="mileage-section">
      <label>🎯 사용할 마일리지:</label>
      <input
        type="number"
        value={usedMileage}
        onChange={handleMileageChange}
        min="0"
        max={maxUsableMileage}
      />
      <button className="btn btn-sm btn-outline-primary" onClick={handleUseAllMileage}>
        모두 사용
      </button>
      <p>보유 마일리지: {remainingMileage.toLocaleString()}P</p>
    </div>
  );
};

export default MileageInput;
