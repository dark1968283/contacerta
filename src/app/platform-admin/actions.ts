"use server"; import { revalidatePath } from "next/cache"; import { redirect } from "next/navigation"; import { requirePlatformAdmin } from "@/lib/supabase/platform";
export async function decidePayment(formData: FormData) {
  const supabase = await requirePlatformAdmin();
  const { error } = await supabase.rpc("confirm_subscription_payment", {
    p_payment_id: String(formData.get("payment_id")),
    p_confirm: String(formData.get("decision")) === "confirm",
    p_notes: String(formData.get("notes") || "") || undefined,
  });

  if (error) {
    const detail = String(error.message || "");
    let code = "pagamento_erro";

    if (detail.includes("payment_superseded")) {
      code = "pagamento_ultrapassado";
    } else if (detail.includes("Pagamento não está pendente")) {
      code = "pagamento_resolvido";
    } else if (detail.includes("subscription_payment_mismatch")) {
      code = "pagamento_invalido";
    }

    redirect(`/platform-admin?erro=${code}`);
  }

  revalidatePath("/platform-admin");
  redirect("/platform-admin?resultado=pagamento_atualizado");
}
export async function savePlan(formData:FormData){const supabase=await requirePlatformAdmin();const id=String(formData.get("id")||"");const values={name:String(formData.get("name")),slug:String(formData.get("slug")),description:String(formData.get("description")||"")||null,monthly_price:Number(formData.get("monthly_price")),yearly_price:Number(formData.get("yearly_price")),display_order:Number(formData.get("display_order")),active:formData.get("active")==="on",features:String(formData.get("features")||"").split(",").map(v=>v.trim()).filter(Boolean),limits:JSON.parse(String(formData.get("limits")||"{}"))};const result=id?await supabase.from("plans").update(values).eq("id",id):await supabase.from("plans").insert(values);if(result.error) throw new Error("NÃ£o foi possÃ­vel guardar o plano.");revalidatePath("/platform-admin");}
