"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminShell from "@/components/AdminShell";

type Order = {
  id: string;
  order_number?: string | null;

  user_id?: string | null;

  customer_email?: string | null;
  customer_name?: string | null;

  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;

  items?: unknown;

  subtotal?: number | null;
  delivery_charge?: number | null;
  total?: number | null;

  payment_method?: string | null;
  payment_status?: string | null;
  transaction_id?: string | null;

  advance_paid?: number | null;
  cod_amount?: number | null;

  order_status?: string | null;
  status?: string | null;

  verified_at?: string | null;
  verified_by?: string | null;
  admin_note?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

const supabase = createClient();

function formatPrice(
  value: number | string | null | undefined
) {
  const amount = Number(value) || 0;

  return `৳${amount.toLocaleString("en-BD")}`;
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function paymentLabel(
  status: string | null | undefined
) {
  switch (
    (status ?? "pending").toLowerCase()
  ) {
    case "paid":
      return "VERIFIED";

    case "pending":
      return "PENDING";

    case "failed":
      return "FAILED";

    case "refunded":
      return "REFUNDED";

    default:
      return (
        status?.toUpperCase() ??
        "PENDING"
      );
  }
}

function statusLabel(
  status: string | null | undefined
) {
  const value = (
    status ?? "pending"
  ).toLowerCase();

  switch (value) {
    case "pending":
      return "PENDING";

    case "confirmed":
      return "CONFIRMED";

    case "processing":
      return "PROCESSING";

    case "shipped":
      return "SHIPPED";

    case "delivered":
      return "DELIVERED";

    case "cancelled":
      return "CANCELLED";

    default:
      return value.toUpperCase();
  }
}

function paymentClass(
  status: string | null | undefined
) {
  const value = (
    status ?? "pending"
  ).toLowerCase();

  if (value === "paid") {
    return "status-paid";
  }

  if (value === "failed") {
    return "status-failed";
  }

  if (value === "refunded") {
    return "status-refunded";
  }

  return "status-pending";
}

function orderStatusClass(
  status: string | null | undefined
) {
  const value = (
    status ?? "pending"
  ).toLowerCase();

  if (value === "confirmed") {
    return "order-confirmed";
  }

  if (value === "processing") {
    return "order-processing";
  }

  if (value === "shipped") {
    return "order-shipped";
  }

  if (value === "delivered") {
    return "order-delivered";
  }

  if (value === "cancelled") {
    return "order-cancelled";
  }

  return "order-pending";
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const initialPayment =
    searchParams.get("payment") || "all";

  const initialStatus =
    searchParams.get("status") || "all";

  const [paymentFilter, setPaymentFilter] =
    useState(initialPayment);

  const [statusFilter, setStatusFilter] =
    useState(initialStatus);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data,
        error: queryError,
      } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (queryError) {
        console.error(
          "ADMIN ORDERS ERROR:",
          queryError
        );

        setError(
          queryError.message ||
            "Unable to load orders."
        );

        setOrders([]);
        return;
      }

      setOrders(
        (data ?? []) as Order[]
      );
    } catch (err) {
      console.error(
        "LOAD ORDERS ERROR:",
        err
      );

      setOrders([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const channel =
      supabase
        .channel(
          "admin-orders-page"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  useEffect(() => {
    setPaymentFilter(
      searchParams.get("payment") ||
        "all"
    );

    setStatusFilter(
      searchParams.get("status") ||
        "all"
    );
  }, [searchParams]);

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter(
      (order) => {
        const payment =
          (
            order.payment_status ??
            "pending"
          ).toLowerCase();

        const orderStatus =
          (
            order.order_status ??
            order.status ??
            "pending"
          ).toLowerCase();

        const matchesPayment =
          paymentFilter === "all" ||
          payment ===
            paymentFilter.toLowerCase();

        const matchesStatus =
          statusFilter === "all" ||
          orderStatus ===
            statusFilter.toLowerCase();

        if (
          !matchesPayment ||
          !matchesStatus
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const searchable = [
          order.order_number,
          order.id,
          order.customer_email,
          order.customer_name,
          order.shipping_name,
          order.shipping_phone,
          order.transaction_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      }
    );
  }, [
    orders,
    search,
    paymentFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    const pending =
      orders.filter(
        (order) =>
          (
            order.payment_status ??
            "pending"
          ).toLowerCase() ===
          "pending"
      ).length;

    const paid =
      orders.filter(
        (order) =>
          (
            order.payment_status ??
            ""
          ).toLowerCase() ===
          "paid"
      ).length;

    const failed =
      orders.filter(
        (order) =>
          (
            order.payment_status ??
            ""
          ).toLowerCase() ===
          "failed"
      ).length;

    const delivered =
      orders.filter(
        (order) =>
          (
            order.order_status ??
            order.status ??
            ""
          ).toLowerCase() ===
          "delivered"
      ).length;

    return {
      total: orders.length,
      pending,
      paid,
      failed,
      delivered,
    };
  }, [orders]);

  const updateUrlFilters = (
    payment: string,
    status: string
  ) => {
    const params =
      new URLSearchParams();

    if (
      payment &&
      payment !== "all"
    ) {
      params.set(
        "payment",
        payment
      );
    }

    if (
      status &&
      status !== "all"
    ) {
      params.set(
        "status",
        status
      );
    }

    const query =
      params.toString();

    window.history.replaceState(
      null,
      "",
      query
        ? `/orders?${query}`
        : "/orders"
    );

    setPaymentFilter(payment);
    setStatusFilter(status);
  };

  return (
    <AdminShell>
      <main className="admin-page">

        {/* HEADER */}

        <div className="orders-header">
          <div>
            <span className="admin-eyebrow">
              A-POSITIVE / ORDERS
            </span>

            <h1 className="admin-title">
              ORDER
              <br />
              <em>MANAGEMENT.</em>
            </h1>

            <p className="admin-subtitle">
              Review orders, payment status,
              customer information and delivery
              progress from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="admin-refresh-button"
          >
            <RefreshCw size={14} />
            REFRESH
          </button>
        </div>

        {/* ERROR */}

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

        {/* STATS */}

        <div
          className="orders-mini-stats"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5,minmax(0,1fr))",
            gap: 10,
            marginTop: 35,
          }}
        >
          <MiniStat
            label="TOTAL"
            value={stats.total}
          />

          <MiniStat
            label="PENDING"
            value={stats.pending}
          />

          <MiniStat
            label="VERIFIED"
            value={stats.paid}
          />

          <MiniStat
            label="FAILED"
            value={stats.failed}
          />

          <MiniStat
            label="DELIVERED"
            value={stats.delivered}
          />
        </div>

        {/* FILTERS */}

        <div
          className="orders-toolbar"
          style={{
            marginTop: 30,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            className="orders-search"
            style={{
              flex: 1,
              minWidth: 240,
              display: "flex",
              alignItems: "center",
              gap: 9,
              border:
                "1px solid #dedbd4",
              background: "#fff",
              padding: "0 13px",
            }}
          >
            <Search
              size={15}
              color="#888"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search order, customer, phone or transaction..."
              style={{
                width: "100%",
                height: 44,
                border: 0,
                outline: 0,
                background:
                  "transparent",
                fontSize: 12,
              }}
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) =>
              updateUrlFilters(
                event.target.value,
                statusFilter
              )
            }
            className="admin-filter-select"
          >
            <option value="all">
              ALL PAYMENTS
            </option>

            <option value="pending">
              PENDING
            </option>

            <option value="paid">
              VERIFIED / PAID
            </option>

            <option value="failed">
              FAILED
            </option>

            <option value="refunded">
              REFUNDED
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              updateUrlFilters(
                paymentFilter,
                event.target.value
              )
            }
            className="admin-filter-select"
          >
            <option value="all">
              ALL ORDER STATUS
            </option>

            <option value="pending">
              PENDING
            </option>

            <option value="confirmed">
              CONFIRMED
            </option>

            <option value="processing">
              PROCESSING
            </option>

            <option value="shipped">
              SHIPPED
            </option>

            <option value="delivered">
              DELIVERED
            </option>

            <option value="cancelled">
              CANCELLED
            </option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");

              updateUrlFilters(
                "all",
                "all"
              );
            }}
            className="admin-reset-button"
          >
            RESET
          </button>
        </div>

        {/* RESULT COUNT */}

        <div
          style={{
            marginTop: 18,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: 1.4,
            color: "#999",
          }}
        >
          SHOWING{" "}
          {filteredOrders.length} OF{" "}
          {orders.length} ORDERS
        </div>

        {/* TABLE */}

        <div
          className="admin-table-wrap"
          style={{
            marginTop: 12,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 70,
                textAlign: "center",
                color: "#999",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              LOADING ORDERS...
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    ORDER
                  </th>

                  <th>
                    CUSTOMER
                  </th>

                  <th>
                    AMOUNT
                  </th>

                  <th>
                    PAYMENT
                  </th>

                  <th>
                    ORDER STATUS
                  </th>

                  <th>
                    TRANSACTION
                  </th>

                  <th>
                    DATE
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => {
                    const paymentStatus =
                      (
                        order.payment_status ??
                        "pending"
                      ).toLowerCase();

                    const orderStatus =
                      (
                        order.order_status ??
                        order.status ??
                        "pending"
                      ).toLowerCase();

                    const displayNumber =
                      order.order_number ||
                      `#${order.id
                        .slice(0, 8)
                        .toUpperCase()}`;

                    return (
                      <tr
                        key={order.id}
                      >
                        {/* ORDER */}

                        <td>
                          <Link
                            href={`/orders/${encodeURIComponent(
                              order.id
                            )}`}
                            className="admin-order-link"
                          >
                            {displayNumber}
                          </Link>
                        </td>

                        {/* CUSTOMER */}

                        <td>
                          <div>
                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize: 11,
                                fontWeight:
                                  700,
                              }}
                            >
                              {order.customer_name ||
                                order.shipping_name ||
                                "Customer"}
                            </strong>

                            <span
                              style={{
                                display:
                                  "block",
                                marginTop: 4,
                                fontSize: 9,
                                color:
                                  "#999",
                              }}
                            >
                              {order.customer_email ||
                                "—"}
                            </span>

                            {order.shipping_phone && (
                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop: 3,
                                  fontSize: 9,
                                  color:
                                    "#999",
                                }}
                              >
                                {
                                  order.shipping_phone
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        {/* AMOUNT */}

                        <td>
                          <strong
                            style={{
                              fontSize: 11,
                            }}
                          >
                            {formatPrice(
                              order.total
                            )}
                          </strong>
                        </td>

                        {/* PAYMENT */}

                        <td>
                          <span
                            className={`status-badge ${paymentClass(
                              paymentStatus
                            )}`}
                          >
                            {paymentStatus ===
                            "paid" ? (
                              <CheckCircle2
                                size={11}
                              />
                            ) : paymentStatus ===
                              "failed" ? (
                              <XCircle
                                size={11}
                              />
                            ) : (
                              <Clock3
                                size={11}
                              />
                            )}

                            {paymentLabel(
                              paymentStatus
                            )}
                          </span>
                        </td>

                        {/* ORDER STATUS */}

                        <td>
                          <span
                            className={`order-status-badge ${orderStatusClass(
                              orderStatus
                            )}`}
                          >
                            {statusLabel(
                              orderStatus
                            )}
                          </span>
                        </td>

                        {/* TRANSACTION */}

                        <td>
                          <span
                            style={{
                              fontFamily:
                                "monospace",
                              fontSize: 9,
                              color:
                                order.transaction_id
                                  ? "#555"
                                  : "#aaa",
                            }}
                          >
                            {order.transaction_id ||
                              "—"}
                          </span>
                        </td>

                        {/* DATE */}

                        <td>
                          <span
                            style={{
                              fontSize: 9,
                            }}
                          >
                            {formatDate(
                              order.created_at
                            )}
                          </span>
                        </td>

                        {/* VIEW */}

                        <td>
                          <Link
                            href={`/orders/${encodeURIComponent(
                              order.id
                            )}`}
                            className="admin-order-view"
                          >
                            <Eye size={13} />
                            VIEW
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )}

                {filteredOrders.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 70,
                        textAlign:
                          "center",
                        color: "#999",
                        fontSize: 9,
                        letterSpacing: 1.2,
                      }}
                    >
                      {loading
                        ? "LOADING..."
                        : "NO MATCHING ORDERS."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* BACK */}

        <div
          style={{
            marginTop: 24,
          }}
        >
          <Link
            href="/"
            className="admin-back-link"
          >
            <ArrowLeft size={13} />
            BACK TO DASHBOARD
          </Link>
        </div>
      </main>

      <style jsx>{`
        .orders-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .admin-refresh-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #dedbd4;
          background: #fff;
          color: #111;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.2px;
          cursor: pointer;
        }

        .admin-refresh-button:hover {
          background: #f8f7f4;
        }

        .admin-filter-select {
          min-height: 44px;
          padding: 0 34px 0 12px;
          border: 1px solid #dedbd4;
          background: #fff;
          color: #222;
          outline: 0;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
          cursor: pointer;
        }

        .admin-reset-button {
          min-height: 44px;
          padding: 0 15px;
          border: 1px solid #dedbd4;
          background: #111;
          color: #fff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .admin-reset-button:hover {
          opacity: 0.85;
        }

        .status-badge,
        .order-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 8px;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.8px;
          white-space: nowrap;
        }

        .status-paid {
          color: #275b35;
          background: #eaf4ec;
        }

        .status-pending {
          color: #846719;
          background: #f8f1dc;
        }

        .status-failed {
          color: #8a3030;
          background: #f8e8e8;
        }

        .status-refunded {
          color: #5c4b81;
          background: #eeeafa;
        }

        .order-pending {
          color: #846719;
          background: #f8f1dc;
        }

        .order-confirmed {
          color: #315f8c;
          background: #eaf2fa;
        }

        .order-processing {
          color: #5d4f84;
          background: #efebf8;
        }

        .order-shipped {
          color: #35686c;
          background: #e7f4f4;
        }

        .order-delivered {
          color: #275b35;
          background: #eaf4ec;
        }

        .order-cancelled {
          color: #8a3030;
          background: #f8e8e8;
        }

        .admin-order-view {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #111;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .admin-order-view:hover {
          opacity: 0.55;
        }

        .admin-back-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #777;
          text-decoration: none;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .admin-back-link:hover {
          color: #111;
        }

        .admin-order-link {
          color: #111;
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.6px;
        }

        .admin-order-link:hover {
          opacity: 0.55;
        }

        @media (max-width: 1100px) {
          .orders-mini-stats {
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 800px) {
          .orders-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .orders-mini-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .admin-table-wrap {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 1050px;
          }
        }

        @media (max-width: 520px) {
          .orders-mini-stats {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminShell>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="admin-stat">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}