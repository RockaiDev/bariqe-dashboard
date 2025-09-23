import { useEffect } from "react";

export default function ScrollToTop(): any {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}
