import { useEffect, useRef, useState } from "react";

const PAYPAL_SDK_ID = "paypal-subscription-sdk";
const PAYPAL_CLIENT_ID = "BAA_VVUy2i7l_OQtZ58QUw6j_jiZm4Lm7L9ghlkht9oXmZJiqXxINKlLFX__bzN_KFmOUEaT37zjH-K1uc";
const PAYPAL_SDK_URL = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=buttons&vault=true&intent=subscription`;

let paypalSdkPromise = null;

const loadPayPalSdk = () => {
  if (window.paypal?.Buttons) return Promise.resolve(window.paypal);
  if (paypalSdkPromise) return paypalSdkPromise;

  paypalSdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(PAYPAL_SDK_ID);
    const onLoad = () => {
      if (window.paypal?.Buttons) resolve(window.paypal);
      else reject(new Error("PayPal SDK 載入後無法使用"));
    };
    const onError = () => {
      paypalSdkPromise = null;
      document.getElementById(PAYPAL_SDK_ID)?.remove();
      reject(new Error("PayPal SDK 載入失敗"));
    };

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = PAYPAL_SDK_ID;
    script.src = PAYPAL_SDK_URL;
    script.async = true;
    script.dataset.sdkIntegrationSource = "button-factory";
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return paypalSdkPromise;
};

const supportLink = ({ email, planName, subscriptionId }) => {
  const subject = `PayPal 人工開通，${planName}`;
  const body = [
    `方案：${planName}`,
    `PayPal 訂閱編號：${subscriptionId}`,
    "88La 財務導航登入 Email：",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export default function PayPalSubscriptionButton({ planId, planName, style, supportEmail }) {
  const containerRef = useRef(null);
  const buttonsRef = useRef(null);
  const [state, setState] = useState({ status: "loading", subscriptionId: "" });
  const { shape, color, layout, label } = style;

  useEffect(() => {
    let cancelled = false;

    const renderButton = async () => {
      try {
        const paypal = await loadPayPalSdk();
        if (cancelled || !containerRef.current) return;
        containerRef.current.replaceChildren();

        const buttons = paypal.Buttons({
          style: { shape, color, layout, label },
          createSubscription(data, actions) {
            return actions.subscription.create({ plan_id: planId });
          },
          onApprove(data) {
            if (cancelled) return;
            const subscriptionId = data.subscriptionID || "";
            setState({ status: "approved", subscriptionId });
            if (typeof window.gtag === "function") {
              window.gtag("event", "paypal_subscription_approved", {
                plan_name: planName,
                payment_provider: "paypal",
              });
            }
          },
          onCancel() {
            if (!cancelled) setState({ status: "cancelled", subscriptionId: "" });
          },
          onError() {
            if (!cancelled) setState({ status: "error", subscriptionId: "" });
          },
        });

        if (typeof buttons.isEligible === "function" && !buttons.isEligible()) {
          setState({ status: "unavailable", subscriptionId: "" });
          return;
        }

        buttonsRef.current = buttons;
        if (!cancelled) setState({ status: "ready", subscriptionId: "" });
        await buttons.render(containerRef.current);
      } catch {
        if (!cancelled) setState({ status: "error", subscriptionId: "" });
      }
    };

    renderButton();
    return () => {
      cancelled = true;
      const buttons = buttonsRef.current;
      buttonsRef.current = null;
      if (buttons && typeof buttons.close === "function") {
        const closeResult = buttons.close();
        if (closeResult?.catch) closeResult.catch(() => {});
      }
    };
  }, [planId, planName, shape, color, layout, label]);

  const approved = state.status === "approved";
  const emailHref = approved
    ? supportLink({ email: supportEmail, planName, subscriptionId: state.subscriptionId })
    : "";

  return (
    <div className="paypal-subscription" data-paypal-plan-id={planId}>
      <div
        ref={containerRef}
        className="paypal-button-mount"
        hidden={approved}
        aria-hidden={approved ? "true" : undefined}
      />
      <div className="paypal-subscription-status" role="status" aria-live="polite">
        {state.status === "loading" && "PayPal 按鈕載入中"}
        {state.status === "cancelled" && "尚未完成付款，可以重新選擇。"}
        {state.status === "unavailable" && "這個瀏覽器目前無法使用 PayPal，請改用信用卡付款。"}
        {state.status === "error" && "PayPal 暫時無法載入，請重新整理後再試。"}
        {approved && (
          <div className="paypal-approved">
            <strong>付款完成，等待人工開通</strong>
            <span>訂閱編號：{state.subscriptionId}</span>
            <span>請把訂閱編號與登入 Email 寄給我們。</span>
            <a href={emailHref}>寄出開通信件</a>
          </div>
        )}
      </div>
    </div>
  );
}
