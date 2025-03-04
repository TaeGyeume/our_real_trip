import React, {useState} from 'react';
import {
  updateTopLevelCategory,
  updateSubCategory,
  deleteCategory
} from '../../../api/travelItem/travelItemService';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  Stack,
  Divider,
  Box
} from '@mui/material';
import {ExpandLess, ExpandMore, Edit, Delete} from '@mui/icons-material';

const CategoryList = ({categories, refreshCategories}) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedName, setEditedName] = useState('');

  // 카테고리 열기/닫기 토글
  const toggleCategory = categoryId => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId] // 기존 상태 반전
    }));
  };

  // 카테고리 수정 시작
  const startEditing = (categoryId, currentName) => {
    setEditingCategory(categoryId);
    setEditedName(currentName);
  };

  // 카테고리 수정 저장
  const saveCategoryEdit = async categoryId => {
    try {
      if (!editedName.trim()) {
        alert('카테고리 이름을 입력해주세요.');
        return;
      }

      const category = categories.find(cat => cat._id === categoryId);
      if (!category) return;

      // 중복 이름 확인
      const isDuplicate = categories.some(
        cat =>
          cat._id !== categoryId &&
          cat.name === editedName.trim() &&
          (category.parentCategory
            ? cat.parentCategory?._id === category.parentCategory?._id
            : !cat.parentCategory)
      );

      if (isDuplicate) {
        alert('이미 존재하는 카테고리 이름입니다.');
        return;
      }

      // 중복이 없을 때만 수정 요청
      if (!category.parentCategory) {
        await updateTopLevelCategory(categoryId, {name: editedName});
      } else {
        await updateSubCategory(categoryId, {name: editedName});
      }

      setEditingCategory(null);
      refreshCategories(); // 새로고침
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
    }
  };

  // 카테고리 삭제
  const handleDelete = async categoryId => {
    if (window.confirm('정말 이 카테고리를 삭제하시겠습니까?')) {
      try {
        await deleteCategory(categoryId);
        refreshCategories(); // 삭제 후 새로고침
      } catch (error) {
        console.error('카테고리 삭제 실패:', error);
      }
    }
  };

  return (
    <Box sx={{maxWidth: 1400, mx: 'auto', mt: 4}}>
      <Card sx={{borderRadius: 3, boxShadow: 3, p: 2}}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            📂 카테고리 목록
          </Typography>

          {categories.length > 0 ? (
            <List>
              {categories
                .filter(cat => !cat.parentCategory) // 최상위 카테고리만 필터링
                .map(cat => (
                  <Box key={cat._id}>
                    <ListItem
                      sx={{
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        mb: 1,
                        px: 2
                      }}>
                      {/* 카테고리명 표시 또는 수정 입력창 */}
                      {editingCategory === cat._id ? (
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={editedName}
                          onChange={e => setEditedName(e.target.value)}
                          onBlur={() => saveCategoryEdit(cat._id)}
                          onKeyDown={e => e.key === 'Enter' && saveCategoryEdit(cat._id)}
                          autoFocus
                          size="small"
                        />
                      ) : (
                        <ListItemText
                          primary={
                            <Typography
                              sx={{cursor: 'pointer', fontWeight: 'bold'}}
                              onClick={() => toggleCategory(cat._id)}>
                              {cat.name}
                            </Typography>
                          }
                        />
                      )}

                      {/* 수정 및 삭제 버튼 */}
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => startEditing(cat._id, cat.name)}>
                          <Edit color="primary" />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(cat._id)}>
                          <Delete color="error" />
                        </IconButton>
                        <IconButton onClick={() => toggleCategory(cat._id)}>
                          {expandedCategories[cat._id] ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Stack>
                    </ListItem>

                    {/* 하위 카테고리 목록 */}
                    <Collapse
                      in={expandedCategories[cat._id]}
                      timeout="auto"
                      unmountOnExit>
                      <List sx={{pl: 3}}>
                        {categories
                          .filter(subCat => subCat.parentCategory?._id === cat._id)
                          .map(subCat => (
                            <ListItem
                              key={subCat._id}
                              sx={{backgroundColor: '#fafafa', borderRadius: 2, mb: 1}}>
                              {/* 하위 카테고리명 표시 또는 수정 입력창 */}
                              {editingCategory === subCat._id ? (
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  value={editedName}
                                  onChange={e => setEditedName(e.target.value)}
                                  onBlur={() => saveCategoryEdit(subCat._id)}
                                  onKeyDown={e =>
                                    e.key === 'Enter' && saveCategoryEdit(subCat._id)
                                  }
                                  autoFocus
                                  size="small"
                                />
                              ) : (
                                <ListItemText primary={subCat.name} />
                              )}

                              {/* 수정 및 삭제 버튼 */}
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  onClick={() => startEditing(subCat._id, subCat.name)}>
                                  <Edit color="primary" />
                                </IconButton>
                                <IconButton onClick={() => handleDelete(subCat._id)}>
                                  <Delete color="error" />
                                </IconButton>
                              </Stack>
                            </ListItem>
                          ))}
                      </List>
                    </Collapse>
                    <Divider />
                  </Box>
                ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              카테고리가 없습니다.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CategoryList;
