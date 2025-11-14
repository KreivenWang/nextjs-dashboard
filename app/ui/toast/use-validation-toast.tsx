import { State } from "@/app/lib/actions";
import { useEffect } from "react";
import toast from "react-hot-toast";

// 自定义 Hook：根据 state 展示 Toast
const useValidationToast = (state: State) => {
  useEffect(() => {
    if (state.errorToast) {
      toast.error(state.errorToast);
    } else if (state.successToast) {
      toast.success(state.successToast);
    }
  }, [state]);
};

export default useValidationToast;
