import { useCallback, useEffect, useRef, useState } from 'react';
import Input from '../../ui/input/Input';
import {
  METHOD_DATA,
  OCC_DATA,
  KIND_DATA,
  SERVINGS_DATA,
  TIME_DATA,
} from '../../../assets/data/categoryData';
import IngredientList from '../ingredients/IngredientTagList';
import styled from 'styled-components';
import PhotoInput from '../../ui/input/PhotoInput';
import UpdateRecipeSteps from './UpdateRecipeSteps';
import Button from '../../ui/button/Button';
import CategoryOption from '../../category/CategoryOption';
import { registerRecipe, sendUpdatedRecipe } from '../../../api/recipes';
import { useQuery } from 'react-query';
import Modal from '../../ui/modal/Modal';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../../ui/animation/LoadingSpinner';
import IconOption from '../../category/IconOption';
import { useRecoilState, useResetRecoilState } from 'recoil';
import { filterState, updateDataState } from '../../../store/store';
import Swal from 'sweetalert2';

const UpdateForm = () => {
  const recipeTitleRef = useRef();
  const mainImgRef = useRef();
  const kindRef = useRef();
  const servingRef = useRef();
  const timeRef = useRef();
  const methodRef = useRef();
  const occRef = useRef();
  const ingredientRef = useRef();
  const sauceRef = useRef();
  const stepRef = useRef();
  const stepImgRef = useRef();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingredientList, setIngredientList] = useState([]);
  const [seasoningList, setSeasoningList] = useState([]);
  const [message, setMessage] = useState('');
  const [imageContent, setImageContent] = useState({
    files: [],
    url: {},
  });

  const [option, setOption] = useRecoilState(filterState);
  const resetOption = useResetRecoilState(filterState);
  const [updateData, setUpdateData] = useRecoilState(updateDataState);

  const [cookingStep, setCookingStep] = useState({});
  const [stepNum, setStepNum] = useState([0]);

  const formData = new FormData();

  const [newRecipe, setNewRecipe] = useState({
    recipe_name: '',
    method: '',
    occation: '',
    kind: '',
    cooking_step: [],
    step_count: 0,
    serving: '',
    time: '',
    total_ingredients: { 재료: {}, 양념: {} },
  });

  let updateStep = updateData.cooking_step;

  const {
    data,
    isLoading,
    refetch: registerNewRecipe,
  } = useQuery(
    'register-recipe',
    () => sendUpdatedRecipe(updateData.recipe_id, formData),
    {
      enabled: false,
      refetchOnWindowFocus: false,
      cacheTime: 0,
    }
  );

  /* 레시피 제목 변경 */
  const handleChangeRecipeTitle = useCallback(
    (e) => {
      const title = e.target.value.trim();
      setNewRecipe({ ...newRecipe, ['recipe_name']: title });
    },
    [newRecipe]
  );

  const handleChangeOption = useCallback(
    (value) => {
      const tagType = value.target.name;
      const tagName = value.target.id.slice(1, value.target.id.length);

      setOption({
        ...option,
        [tagType]: tagName,
      });
    },
    [option]
  );

  const handleSumbitRecipe = () => {
    formData.append('data', JSON.stringify(newRecipe));
    imageContent?.files.forEach((item) =>
      formData.append(Object.keys(item)[0], Object.values(item)[0])
    );
    setIsModalOpen(false);
    registerNewRecipe();
  };

  /* 레시피 작성 취소 */
  const handleCancelSubmit = () => {
    setIsModalOpen(false);
  };

  /* 재료 */
  const totalIngredient = Object.fromEntries(ingredientList);

  /* 양념 */
  const totalSeasoning = Object.fromEntries(seasoningList);

  /* 조리 단계 */
  const totalCookingStep = Object.values(cookingStep);

  /* 스텝 추가 */
  const handleAddSteps = (e) => {
    e.preventDefault();
    setStepNum((prev) => [
      ...prev,
      prev.length ? Number(prev[prev.length - 1]) + 1 : prev[0] + 1,
    ]);
  };

  const handleCompleteRecipe = (e) => {
    e.preventDefault();
    setNewRecipe({
      ...newRecipe,
      ['cooking_step']: totalCookingStep,
      ['total_ingredients']: JSON.stringify({
        재료: totalIngredient,
        양념: totalSeasoning,
      }),
      ['kind']: option.kind,
      ['method']: option.method,
      ['occation']: option.occ,
      ['serving']: option.serving,
      ['time']: option.time,
      ['step_count']:
        newRecipe.cooking_step === '' || imageContent.files.length <= 1
          ? 0
          : stepNum.length,
    });

    setIsModalOpen(true);
    setMessage('레시피 작성을 완료하셨나요?');
  };

  useEffect(() => {
    setOption({
      ...option,
      ['kind']: updateData.kind,
      ['serving']: updateData.serving,
      ['time']: updateData.time,
      ['method']: updateData.method,
      ['occ']: updateData.occation,
    });
    setStepNum(updateData.step_number);
    setNewRecipe({
      ...newRecipe,
      ['recipe_name']: updateData.recipe_name,
      ['step_count']:
        updateData.cooking_step === '' ? 0 : updateData.step_number.length,
    });
    setIngredientList(updateData.ingredients);
    setSeasoningList(updateData.sauce);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (data?.data.success) {
    resetOption();
    return <Navigate to={`/recipes/${data.data.recipe_id}`} />;
  }

  return (
    <>
      {isModalOpen && (
        <Modal
          onConfirm={handleSumbitRecipe}
          onCancel={handleCancelSubmit}
          message={message}
        />
      )}
      <RecipeFormContainer onSubmit={handleCompleteRecipe}>
        <RecipeFormHeader>
          <h2>레시피 수정</h2>
          <hr />
        </RecipeFormHeader>
        <MainOptionContainer>
          <Input
            type='text'
            className='title'
            ref={recipeTitleRef}
            value={newRecipe.recipe_name}
            placeholder='제목을 입력해주세요'
            onChange={handleChangeRecipeTitle}
          />
          <PhotoInput
            id='main_image'
            className='main-image'
            images={imageContent}
            onChangeImg={setImageContent}
            placeholder='메인사진을 업로드 해주세요.'
            ref={mainImgRef}
          />
          <p>요리 종류</p>
          <IconOption data={KIND_DATA} option={option.kind} ref={kindRef} />
          <CategoryOptionContainer>
            <CategoryOption
              data={SERVINGS_DATA.slice(1)}
              onChange={handleChangeOption}
              option={option.serving}
              ref={servingRef}
            >
              인분:
            </CategoryOption>
            <CategoryOption
              data={TIME_DATA.slice(1)}
              onChange={handleChangeOption}
              option={option.time}
              ref={timeRef}
            >
              시간:
            </CategoryOption>
            <CategoryOption
              data={METHOD_DATA.slice(1)}
              onChange={handleChangeOption}
              option={option.method}
              ref={methodRef}
            >
              방법:
            </CategoryOption>
            <CategoryOption
              data={OCC_DATA.slice(1)}
              onChange={handleChangeOption}
              option={option.occ}
              ref={occRef}
            >
              상황:
            </CategoryOption>
          </CategoryOptionContainer>
        </MainOptionContainer>
        <p>사용 재료</p>
        <IngredientContainer>
          <IngredientList
            text='사용 재료'
            list={ingredientList}
            onChangeList={setIngredientList}
            ref={ingredientRef}
          />
        </IngredientContainer>
        <p>사용 양념</p>
        <IngredientContainer>
          <IngredientList
            text='사용 양념'
            list={seasoningList}
            onChangeList={setSeasoningList}
            ref={sauceRef}
          />
        </IngredientContainer>
        <StepContainer>
          {stepNum.map((idx) => (
            <div key={idx}>
              <h3>
                조리 단계 {Number(Object.keys(stepNum).splice(idx, 1)) + 1}
              </h3>
              <UpdateRecipeSteps
                key={idx}
                id={idx.toString()}
                cookingStep={updateStep}
                onChangeStep={setCookingStep}
                stepNum={updateData.step_number}
                onChangeNum={setStepNum}
                imgContent={imageContent}
                onChangeImg={setImageContent}
                ref={stepRef}
              >
                <PhotoInput
                  id={`step${idx + 1}`}
                  images={imageContent}
                  onChangeImg={setImageContent}
                  placeholder='단계별 사진을 업로드 해주세요.'
                  ref={stepImgRef}
                />
              </UpdateRecipeSteps>
            </div>
          ))}
        </StepContainer>
        <Button className='add-step' onClick={handleAddSteps}>
          순서 추가
        </Button>
        <Button className='submit'>작성 완료</Button>
      </RecipeFormContainer>
    </>
  );
};

export default UpdateForm;

const RecipeFormContainer = styled.form`
  margin: 3rem auto;
  height: fit-content;
  width: 60rem;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  @media (max-width: 960px) {
    width: 90%;
    margin-left: 1rem;
  }

  @media (max-width: 390px) {
    width: 370px;
    margin-left: 1rem;
  }
`;

const RecipeFormHeader = styled.header`
  margin: 0 0 2rem auto;
  padding-top: 1rem;
  width: 100%;
  background-color: green;
  border-radius: 8px 8px 0 0;
  opacity: 0.9;
  > h2 {
    color: white;
    text-align: center;
    margin: 1rem;
  }
`;

const MainOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  > p {
    margin-top: 1.5rem;
    font-size: 1.2rem;
  }
`;

const StepContainer = styled.div`
  margin: 20px;

  @media (max-width: 490px) {
    display: flex;
    flex-direction: column;
  }
`;

const CategoryOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  margin-bottom: 30px;
`;

const IngredientContainer = styled.div`
  display: flex;
  align-items: center;
`;
