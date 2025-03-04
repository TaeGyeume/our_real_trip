import React, {useState, useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  fetchAllCategories,
  fetchTravelItem,
  createTravelItem,
  updateTravelItem
} from '../../../api/travelItem/travelItemService';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Typography,
  Paper,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const TravelItemForm = ({isEdit = false, itemId = null, onItemCreated = () => {}}) => {
  const navigate = useNavigate();
  const {itemId: paramItemId} = useParams();
  const finalItemId = itemId || paramItemId;

  const [categories, setCategories] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removeImages, setRemoveImages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topCategory: '',
    category: '',
    parentCategory: '',
    price: '',
    stock: '',
    images: []
  });

  const SERVER_URL =
    process.env.REACT_APP_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://ourrealtrip.shop/api';

  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchAllCategories();
      setCategories(data);
      setTopCategories(data.filter(cat => !cat.parentCategory));
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (isEdit && finalItemId) {
      const fetchItem = async () => {
        try {
          const response = await fetchTravelItem(finalItemId);
          const itemData = response.data;

          let topCategoryId = '';
          let parentCategoryId = '';

          if (itemData.parentCategory) {
            parentCategoryId = itemData.parentCategory._id;
            topCategoryId = itemData.parentCategory.parentCategory
              ? itemData.parentCategory.parentCategory._id
              : itemData.parentCategory._id;
          }

          setFormData({
            name: itemData.name,
            description: itemData.description,
            topCategory: topCategoryId,
            category: parentCategoryId,
            parentCategory: parentCategoryId,
            price: itemData.price,
            stock: itemData.stock,
            images: itemData.images || []
          });

          setPreviewImages(itemData.images.map(img => `${SERVER_URL}${img}`));

          if (topCategoryId) {
            setSubCategories(
              categories.filter(cat => cat.parentCategory?._id === topCategoryId)
            );
          }
        } catch (error) {
          console.error('기존 상품 불러오기 실패:', error);
        }
      };

      fetchItem();
    }
  }, [isEdit, finalItemId, categories]);

  const handleTopCategoryChange = e => {
    const selectedTopCategory = e.target.value;
    setFormData({
      ...formData,
      topCategory: selectedTopCategory,
      category: '',
      parentCategory: ''
    });

    setSubCategories(
      selectedTopCategory
        ? categories.filter(cat => cat.parentCategory?._id === selectedTopCategory)
        : []
    );
  };

  const handleChange = e => {
    const {name, value} = e.target;
    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'category' && {parentCategory: value})
    });
  };

  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    setPreviewImages([...previewImages, ...files.map(file => URL.createObjectURL(file))]);
  };

  const handleRemoveImage = index => {
    if (index < formData.images.length) {
      const removedImage = formData.images[index];
      setRemoveImages(prev => [...prev, removedImage]);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== index - formData.images.length));
    }
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // 상품 이름 중복 확인
    const existingItems = await fetchAllCategories(); // 모든 상품 데이터 가져오기
    const isDuplicate = existingItems.some(
      item => item.name === formData.name && item._id !== finalItemId
    );

    if (isDuplicate) {
      alert('이미 존재하는 상품명입니다. 다른 이름을 입력해주세요.');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        newImages.forEach(file => data.append('images', file));
      } else {
        data.append(key, value);
      }
    });

    if (removeImages.length > 0) {
      data.append('removeImages', JSON.stringify(removeImages));
    }

    try {
      isEdit ? await updateTravelItem(finalItemId, data) : await createTravelItem(data);
      navigate('/product/travelItems/list');
      onItemCreated();
    } catch (error) {
      console.error('상품 처리 실패:', error);
    }
  };

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Card sx={{p: 3, borderRadius: 2, boxShadow: 3}}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            🛍️ 여행용품 {isEdit ? '수정' : '등록'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="상품명"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="설명"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>최상위 카테고리</InputLabel>
                <Select
                  label="최상위 카테고리"
                  name="topCategory"
                  value={formData.topCategory}
                  onChange={handleTopCategoryChange}>
                  <MenuItem value="">선택</MenuItem>
                  {topCategories.map(cat => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {subCategories.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>하위 카테고리</InputLabel>
                  <Select
                    label="하위 카테고리"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}>
                    <MenuItem value="">선택</MenuItem>
                    {subCategories.map(subCat => (
                      <MenuItem key={subCat._id} value={subCat._id}>
                        {subCat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="가격 (₩)"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="재고"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                fullWidth
              />

              <Button variant="contained" component="label">
                이미지 업로드
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>

              {previewImages.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {previewImages.map((img, index) => (
                    <Paper key={index} sx={{p: 1, position: 'relative'}}>
                      <img src={img} alt={`미리보기-${index}`} width="100" />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{position: 'absolute', top: 0, right: 0}}>
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button type="submit" variant="contained">
                  {isEdit ? '수정' : '등록'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/product/travelItems/list')}>
                  취소
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TravelItemForm;
