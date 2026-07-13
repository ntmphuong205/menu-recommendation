import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export function CartScreen() {
  const { cart, updateQty, removeItem, clearCart, findDish, totalPrice, setActiveTab, placeOrder, tableNumber } =
    useApp();
  const [submittedTable, setSubmittedTable] = useState<number | null>(null);

  if (submittedTable !== null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#E5F3EA] flex items-center justify-center">
          <CheckCircle2 size={34} className="text-[#2D5A3D]" />
        </div>
        <h2 className="text-[17px] font-bold text-[#22201B]">Order placed!</h2>
        <p className="text-[13px] text-[#8A8272] leading-relaxed">
          Your order for Table {submittedTable} has been sent to the kitchen. Your food will be brought to your table shortly.
        </p>
        <button
          onClick={() => {
            setSubmittedTable(null);
            setActiveTab("chat");
          }}
          className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
        >
          Back to Chat
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#EFE9D8] flex items-center justify-center">
          <ShoppingBag size={28} className="text-[#B0A794]" />
        </div>
        <h2 className="text-[15px] font-bold text-[#22201B]">Your cart is empty</h2>
        <p className="text-[13px] text-[#8A8272] leading-relaxed">
          Chat with Menu AI or browse the Menu tab to pick something delicious!
        </p>
        <button
          onClick={() => setActiveTab("chat")}
          className="mt-2 px-5 py-2.5 rounded-full bg-[#2D5A3D] text-white text-[13px] font-semibold active:scale-95 transition-transform"
        >
          Ask Menu AI
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-2 pb-3 border-b border-black/5 bg-[#FBF7EF] flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-bold text-[#22201B]">Cart</h1>
          <p className="text-[11px] text-[#8A8272]">Table {tableNumber}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {cart.map((item) => {
          const dish = findDish(item.dishId);
          if (!dish) return null;
          return (
            <div key={item.id} className="flex gap-3 bg-white rounded-2xl p-2.5 border border-black/5 shadow-sm">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#EFE9D8]">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-[#22201B] leading-tight">{dish.name}</p>
                  <button onClick={() => removeItem(item.id)} className="text-[#B0A794] shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                {item.note && <p className="text-[11px] text-[#B0553C] mt-0.5">{item.note}</p>}
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2 bg-[#F5F1E6] rounded-full px-2 py-1">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-5 h-5 flex items-center justify-center text-[#2D5A3D]"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-[12px] font-semibold w-3 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-5 h-5 flex items-center justify-center text-[#2D5A3D]"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-[13px] font-bold text-[#2D5A3D]">
                    ${(dish.price * item.qty).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 px-4 pt-3 pb-4 border-t border-black/5 bg-[#FBF7EF]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] text-[#8A8272]">Total</span>
          <span className="text-[18px] font-bold text-[#22201B]">${totalPrice.toFixed(2)}</span>
        </div>
        <button
          onClick={() => {
            placeOrder(tableNumber);
            setSubmittedTable(tableNumber);
            clearCart();
          }}
          className="w-full bg-[#2D5A3D] text-white font-semibold text-[14px] py-3.5 rounded-full active:scale-[0.98] transition-transform"
        >
          Confirm order
        </button>
      </div>
    </div>
  );
}
