import { Button } from "@/shared/components/ui/button";


interface AppleAuthButtonProps {
    text: string;
    onClick?: () => void;
}

const AppleAuthButton = ({ text, onClick }: AppleAuthButtonProps) => {
  return (
    <Button variant="outline" type="button" className="w-full bg-black  border-none text-white h-11" onClick={onClick}>
      <div className="flex items-center justify-center gap-2 w-full">
         {/* Apple Logo */}
         <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-54.7-65.6-53.1-66.6zM247.9 160c16.9-18.8 31.2-45.9 27.1-75.5-22.9 1.4-53.8 14-74.9 36-16.7 17.2-31.5 45-27.4 72.8 28.5 2.5 54.7-11.4 75.2-33.3z"/>
         </svg>
        <span className="font-medium">{text}</span>
      </div>
    </Button>
  );
};

export default AppleAuthButton;
