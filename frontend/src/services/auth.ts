import axiosInstance from "@/helper/axiosInstance";

export type LoginPayload = {
  email: string;
  password: string;
};

export const loginRequest = async (data: LoginPayload) => {
  try {
    const res = await axiosInstance.post("/auth/signin", data);
    // axiosInstance interceptor returns response.data already
 
    return res;
  } catch (err: any) {

    // normalize error shape for UI
    if (err?.result?.message) {
      throw err;
    }
    throw { result: { message: err?.message || 'Login failed' } };
  }

}; 

export async function logoutRequest() {
  return axiosInstance.post("/auth/signout", {}, { withCredentials: true });
}