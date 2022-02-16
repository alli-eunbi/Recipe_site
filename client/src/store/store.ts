import { atom, atomFamily } from 'recoil';

const selectedOptionState = atomFamily({
  key: 'optionState',
  default: (name) => {
    return {
      name: '',
      checked: false,
    };
  },
});
