"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageCheck,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminShell from "@/components/AdminShell";

type OrderItem = {
  id?: string;
  name?: string;
  title?: string;
  product_name?: string;
  price?: number | string;
  quantity?: number | string;
  image?: string;
  image_url?: string;
};

type Order = {
  id: string;
  user_id?: string | null;
  customer_email?: string | null;

  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;

  subtotal?: number | null;
  delivery_charge?: number | null;
  total?: number | null;

  payment_method?: string | null;
  transaction_id?: string | null;
  advance_paid?: number | null;
  cod_amount?: number | null;

  payment_status?: string | null;
  order_status?: string | null;
  status?: string | null;

  verified_at?: string | null;
  verified_by?: string | null;
  admin_note?: string | null;

  items?: OrderItem[] | null;

  created_at?: string | null;
  updated_at?: string | null;
};

const supabase = createClient();

const BKASH_NUMBER = "01850350510";

function formatPrice(
  value:
    | number
    | string
    | null
    | undefined
) {
  const amount = Number(value) || 0;

  return `৳${amount.toLocaleString(
    "en-BD"
  )}`;
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getItemName(
  item: OrderItem
) {
  return (
    item.name ??
    item.title ??
    item.product_name ??
    "Product"
  );
}

function getItemImage(
  item: OrderItem
) {
  return (
    item.image_url ??
    item.image ??
    ""
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = String(
    params.id ?? ""
  );

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [adminNote, setAdminNote] =
    useState("");

  async function loadOrder() {
    if (!orderId) {
      return;
    }

    try {
      setError("");

      const {
        data,
        error: queryError,
      } =
        await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

      if (queryError) {
        console.error(
          "ORDER DETAILS ERROR:",
          queryError
        );

        throw new Error(
          queryError.message
        );
      }

      if (!data) {
        throw new Error(
          "Order not found."
        );
      }

      setOrder(data);
      setAdminNote(
        data.admin_note ?? ""
      );
    } catch (err) {
      console.error(
        "LOAD ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();

    if (!orderId) {
      return;
    }

    const channel =
      supabase
        .channel(
          `admin-order-${orderId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          () => {
            loadOrder();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [orderId]);

  async function getCurrentAdminId() {
    const {
      data,
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !data.user
    ) {
      throw new Error(
        "Admin session expired. Please log in again."
      );
    }

    return data.user.id;
  }

  async function updatePayment(
  type: "verified" | "failed"
) {
  if (!order) {
    return;
  }

  setActionLoading(true);
  setError("");
  setSuccess("");

  try {
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error(
        "Admin session expired. Please log in again."
      );
    }

    const adminId =
      userData.user.id;

    const now =
      new Date().toISOString();

    const isVerified =
      type === "verified";

    const updatePayload = {
      payment_status: isVerified
        ? "paid"
        : "failed",

      status: isVerified
        ? "confirmed"
        : "cancelled",

      verified_at: now,

      verified_by: adminId,

      admin_note:
        adminNote.trim() || null,

      updated_at: now,
    };

    console.log(
      "ADMIN ORDER UPDATE PAYLOAD:",
      updatePayload
    );

    const {
      error: updateError,
    } =
      await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id);

    if (updateError) {
      console.error(
        "ORDER UPDATE ERROR MESSAGE:",
        updateError.message
      );

      console.error(
        "ORDER UPDATE ERROR DETAILS:",
        updateError.details
      );

      console.error(
        "ORDER UPDATE ERROR HINT:",
        updateError.hint
      );

      console.error(
        "ORDER UPDATE ERROR CODE:",
        updateError.code
      );

      throw new Error(
        updateError.message ||
          "Unable to update order."
      );
    }

    setSuccess(
      isVerified
        ? "Payment verified successfully."
        : "Payment marked as failed."
    );

    await loadOrder();
  } catch (err) {
    console.error(
      "PAYMENT ACTION ERROR:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Unable to update payment."
    );
  } finally {
    setActionLoading(false);
  }
}

  if (loading) {
    return (
      <AdminShell>
        <main className="admin-page">
          <div
            className="admin-loading"
            style={{
              minHeight: 500,
            }}
          >
            LOADING ORDER...
          </div>
        </main>
      </AdminShell>
    );
  }

  if (!order) {
    return (
      <AdminShell>
        <main className="admin-page">
          <div className="admin-error">
            {error ||
              "Order not found."}
          </div>
        </main>
      </AdminShell>
    );
  }

  const paymentStatus =
    (
      order.payment_status ??
      "pending"
    ).toLowerCase();

  const orderStatus =
    (
      order.order_status ??
      order.status ??
      "processing"
    ).toLowerCase();

  const items = Array.isArray(
    order.items
  )
    ? order.items
    : [];

  const canVerify =
    paymentStatus ===
    "pending";

  return (
    <AdminShell>
      <main className="admin-page">

        <Link
          href="/orders"
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: 7,
            color: "#77736c",
            textDecoration:
              "none",
            fontSize: 7,
            fontWeight: 900,
            letterSpacing: 1.3,
          }}
        >
          <ArrowLeft size={13} />
          BACK TO ORDERS
        </Link>

        <div
          style={{
            marginTop: 34,
          }}
        >
          <span className="admin-eyebrow">
            A-POSITIVE / ORDER
          </span>

          <h1 className="admin-title">
            ORDER
            <br />
            <em>DETAILS.</em>
          </h1>

          <p className="admin-subtitle">
            Order #{order.id}
          </p>
        </div>

        {error && (
          <div
            className="admin-error"
            style={{
              marginTop: 25,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="admin-success"
            style={{
              marginTop: 25,
            }}
          >
            {success}
          </div>
        )}

        <div className="order-detail-grid">

          {/* LEFT */}

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: 18,
            }}
          >

            {/* CUSTOMER */}

            <section className="order-detail-card">
              <h2>
                CUSTOMER
              </h2>

              <div className="detail-row">
                <span>
                  <User
                    size={11}
                    style={{
                      verticalAlign:
                        "middle",
                      marginRight:
                        6,
                    }}
                  />
                  NAME
                </span>

                <strong>
                  {order.shipping_name ??
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  EMAIL
                </span>

                <strong>
                  {order.customer_email ??
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  <Phone
                    size={11}
                    style={{
                      verticalAlign:
                        "middle",
                      marginRight:
                        6,
                    }}
                  />
                  PHONE
                </span>

                <strong>
                  {order.shipping_phone ??
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  <MapPin
                    size={11}
                    style={{
                      verticalAlign:
                        "middle",
                      marginRight:
                        6,
                    }}
                  />
                  ADDRESS
                </span>

                <strong>
                  {order.shipping_address ??
                    "—"}
                </strong>
              </div>
            </section>

            {/* ITEMS */}

            <section className="order-detail-card">
              <h2>
                ORDER ITEMS
              </h2>

              <div className="order-items">

                {items.length >
                0 ? (
                  items.map(
                    (
                      item,
                      index
                    ) => {
                      const quantity =
                        Number(
                          item.quantity
                        ) || 1;

                      const price =
                        Number(
                          item.price
                        ) || 0;

                      const image =
                        getItemImage(
                          item
                        );

                      return (
                        <div
                          className="order-item"
                          key={
                            item.id ??
                            `${getItemName(
                              item
                            )}-${index}`
                          }
                        >

                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={getItemName(
                                item
                              )}
                            />
                          ) : (
                            <div
                              style={{
                                width: 60,
                                height: 74,
                                background:
                                  "#ebe8e2",
                                display:
                                  "grid",
                                placeItems:
                                  "center",
                                color:
                                  "#999",
                                fontSize:
                                  7,
                              }}
                            >
                              NO IMAGE
                            </div>
                          )}

                          <div>
                            <span>
                              PRODUCT
                            </span>

                            <strong>
                              {getItemName(
                                item
                              )}
                            </strong>

                            <small>
                              Quantity:{" "}
                              {
                                quantity
                              }
                            </small>
                          </div>

                          <b>
                            {formatPrice(
                              price *
                                quantity
                            )}
                          </b>

                        </div>
                      );
                    }
                  )
                ) : (
                  <div
                    style={{
                      color:
                        "#99958e",
                      fontSize: 8,
                    }}
                  >
                    No item data available.
                  </div>
                )}

              </div>
            </section>

            {/* TOTALS */}

            <section className="order-detail-card">
              <h2>
                ORDER SUMMARY
              </h2>

              <div className="detail-row">
                <span>
                  SUBTOTAL
                </span>

                <strong>
                  {formatPrice(
                    order.subtotal
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  DELIVERY
                </span>

                <strong>
                  {formatPrice(
                    order.delivery_charge
                  )}
                </strong>
              </div>

              <div
                className="detail-row"
                style={{
                  paddingTop:
                    18,
                  borderTop:
                    "1px solid #111",
                }}
              >
                <span>
                  TOTAL
                </span>

                <strong
                  style={{
                    fontSize: 13,
                  }}
                >
                  {formatPrice(
                    order.total
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  ADVANCE PAID
                </span>

                <strong>
                  {formatPrice(
                    order.advance_paid
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  COD AMOUNT
                </span>

                <strong>
                  {formatPrice(
                    order.cod_amount
                  )}
                </strong>
              </div>
            </section>

          </div>

          {/* RIGHT */}

          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: 18,
            }}
          >

            {/* PAYMENT */}

            <section className="order-detail-card">
              <h2>
                PAYMENT
              </h2>

              <div className="detail-row">
                <span>
                  METHOD
                </span>

                <strong>
                  {(
                    order.payment_method ??
                    "—"
                  ).toUpperCase()}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  BKASH NUMBER
                </span>

                <strong>
                  {BKASH_NUMBER}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  TRANSACTION ID
                </span>

                <strong
                  style={{
                    fontFamily:
                      "monospace",
                  }}
                >
                  {order.transaction_id ??
                    "—"}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  PAYMENT STATUS
                </span>

                <strong>
                  <span
                    className={`status-badge status-${paymentStatus}`}
                  >
                    {paymentStatus.toUpperCase()}
                  </span>
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  ORDER STATUS
                </span>

                <strong>
                  <span
                    className={`status-badge status-${
                      orderStatus ===
                      "payment_failed"
                        ? "failed"
                        : orderStatus
                    }`}
                  >
                    {orderStatus.toUpperCase()}
                  </span>
                </strong>
              </div>

            </section>

            {/* ADMIN ACTION */}

            <section className="order-detail-card">
              <h2>
                ADMIN ACTION
              </h2>

              <p
                style={{
                  margin:
                    "0 0 17px",
                  color:
                    "#77736c",
                  fontSize: 8,
                  lineHeight:
                    1.7,
                }}
              >
                Verify the customer's bKash
                transaction after checking the
                transaction ID and payment amount.
              </p>

              <label className="admin-field">
                <span>
                  ADMIN NOTE
                </span>

                <textarea
                  value={
                    adminNote
                  }
                  onChange={(
                    event
                  ) =>
                    setAdminNote(
                      event.target
                        .value
                    )
                  }
                  rows={5}
                  placeholder="Add a note about this payment..."
                />
              </label>

              <div className="admin-actions">

                <button
                  type="button"
                  className="admin-action-button admin-action-verify"
                  disabled={
                    actionLoading ||
                    !canVerify
                  }
                  onClick={() =>
                    updatePayment(
                      "verified"
                    )
                  }
                >
                  <CheckCircle2
                    size={13}
                  />

                  {actionLoading
                    ? "PROCESSING..."
                    : "VERIFY PAYMENT"}
                </button>

                <button
                  type="button"
                  className="admin-action-button admin-action-fail"
                  disabled={
                    actionLoading ||
                    !canVerify
                  }
                  onClick={() =>
                    updatePayment(
                      "failed"
                    )
                  }
                >
                  <XCircle
                    size={13}
                  />

                  PAYMENT FAILED
                </button>

              </div>

              {!canVerify && (
                <div
                  style={{
                    marginTop:
                      16,
                    padding:
                      12,
                    background:
                      "#f7f5f1",
                    color:
                      "#77736c",
                    fontSize: 7,
                    lineHeight:
                      1.6,
                  }}
                >
                  This payment has already been
                  processed by an administrator.
                </div>
              )}
            </section>

            {/* TIMELINE */}

            <section className="order-detail-card">
              <h2>
                TIMELINE
              </h2>

              <div className="detail-row">
                <span>
                  <Clock3
                    size={11}
                    style={{
                      verticalAlign:
                        "middle",
                      marginRight:
                        6,
                    }}
                  />
                  CREATED
                </span>

                <strong>
                  {formatDate(
                    order.created_at
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  UPDATED
                </span>

                <strong>
                  {formatDate(
                    order.updated_at
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  VERIFIED AT
                </span>

                <strong>
                  {formatDate(
                    order.verified_at
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  ADMIN
                </span>

                <strong
                  style={{
                    fontFamily:
                      "monospace",
                    fontSize: 7,
                  }}
                >
                  {order.verified_by ??
                    "—"}
                </strong>
              </div>
            </section>

            <Link
              href="/orders"
              className="admin-action-button admin-action-outline"
              style={{
                textDecoration:
                  "none",
              }}
            >
              <PackageCheck
                size={13}
              />
              BACK TO ORDERS
            </Link>

          </div>
        </div>
      </main>
    </AdminShell>
  );
}