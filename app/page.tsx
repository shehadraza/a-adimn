"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Package,
  PackageCheck,
  ShoppingBag,
  Users,
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

  total?: number | null;

  payment_status?: string | null;

  order_status?: string | null;
  status?: string | null;

  transaction_id?: string | null;

  created_at?: string | null;
};

type Product = {
  id: string;
  stock?: number | null;
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
    return new Date(value).toLocaleString(
      "en-BD",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  } catch {
    return "—";
  }
}

function paymentLabel(
  status: string
) {
  switch (status.toLowerCase()) {
    case "paid":
      return "VERIFIED";

    case "pending":
      return "PENDING";

    case "failed":
      return "FAILED";

    case "refunded":
      return "REFUNDED";

    default:
      return status.toUpperCase();
  }
}

export default function AdminDashboard() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersResult,
        productsResult,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("products")
          .select("*"),
      ]);

      const errors: string[] = [];

      if (ordersResult.error) {
        console.error(
          "ADMIN ORDERS ERROR:",
          ordersResult.error
        );

        errors.push(
          ordersResult.error.message
        );
      }

      if (productsResult.error) {
        console.error(
          "ADMIN PRODUCTS ERROR:",
          productsResult.error
        );

        errors.push(
          productsResult.error.message
        );
      }

      setOrders(
        (ordersResult.data ?? []) as unknown as Order[]
      );

      setProducts(
        (productsResult.data ?? []) as unknown as Product[]
      );

      if (errors.length > 0) {
        setError(
          errors.join(" | ")
        );
      }
    } catch (err) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const channel =
      supabase
        .channel(
          "admin-dashboard-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            loadDashboard();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
          },
          () => {
            loadDashboard();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  const stats = useMemo(() => {
    const pendingPayments =
      orders.filter(
        (order) =>
          (
            order.payment_status ??
            "pending"
          ).toLowerCase() ===
          "pending"
      ).length;

    const confirmedOrders =
      orders.filter(
        (order) =>
          (
            order.order_status ??
            order.status ??
            ""
          ).toLowerCase() ===
          "confirmed"
      ).length;

    const failedPayments =
      orders.filter(
        (order) =>
          (
            order.payment_status ??
            ""
          ).toLowerCase() ===
          "failed"
      ).length;

    const verifiedValue =
      orders
        .filter(
          (order) =>
            (
              order.payment_status ??
              ""
            ).toLowerCase() ===
            "paid"
        )
        .reduce(
          (total, order) =>
            total +
            (Number(
              order.total
            ) || 0),
          0
        );

    const lowStockProducts =
      products.filter(
        (product) =>
          Number(
            product.stock
          ) <= 5
      ).length;

    const customerKeys =
      new Set<string>();

    for (const order of orders) {
      const email =
        order.customer_email
          ?.trim()
          .toLowerCase();

      const userId =
        order.user_id?.trim();

      const key =
        email ||
        userId;

      if (key) {
        customerKeys.add(key);
      }
    }

    return {
      totalOrders:
        orders.length,

      pendingPayments,

      confirmedOrders,

      failedPayments,

      verifiedValue,

      totalProducts:
        products.length,

      lowStockProducts,

      totalCustomers:
        customerKeys.size,
    };
  }, [
    orders,
    products,
  ]);

  return (
    <AdminShell>
      <main className="admin-page">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <span className="admin-eyebrow">
          A-POSITIVE / ADMINISTRATION
        </span>

        <h1 className="admin-title">
          CONTROL
          <br />
          <em>CENTER.</em>
        </h1>

        <p className="admin-subtitle">
          Monitor customer orders, verify
          bKash payments and manage the
          A-POSITIVE commerce system from
          one place.
        </p>

        {/* =====================================================
            ERROR
        ====================================================== */}

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

        {/* =====================================================
            LIVE STATS
        ====================================================== */}

        <div
          className="admin-stat-grid"
          style={{
            gridTemplateColumns:
              "repeat(5,minmax(0,1fr))",
          }}
        >

          {/* TOTAL ORDERS */}

          <div className="admin-stat">
            <span>
              TOTAL ORDERS
            </span>

            <strong>
              {loading
                ? "—"
                : stats.totalOrders}
            </strong>
          </div>

          {/* PENDING PAYMENTS */}

          <div className="admin-stat">
            <span>
              PENDING PAYMENTS
            </span>

            <strong>
              {loading
                ? "—"
                : stats.pendingPayments}
            </strong>
          </div>

          {/* CONFIRMED */}

          <div className="admin-stat">
            <span>
              CONFIRMED ORDERS
            </span>

            <strong>
              {loading
                ? "—"
                : stats.confirmedOrders}
            </strong>
          </div>

          {/* FAILED */}

          <div className="admin-stat">
            <span>
              FAILED PAYMENTS
            </span>

            <strong>
              {loading
                ? "—"
                : stats.failedPayments}
            </strong>
          </div>

          {/* VERIFIED VALUE */}

          <div className="admin-stat">
            <span>
              VERIFIED ORDER VALUE
            </span>

            <strong
              style={{
                fontSize: 24,
              }}
            >
              {loading
                ? "—"
                : formatPrice(
                    stats.verifiedValue
                  )}
            </strong>
          </div>

          {/* PRODUCTS */}

          <div className="admin-stat">
            <span>
              TOTAL PRODUCTS
            </span>

            <strong>
              {loading
                ? "—"
                : stats.totalProducts}
            </strong>
          </div>

          {/* LOW STOCK */}

          <div className="admin-stat">
            <span>
              LOW STOCK
            </span>

            <strong>
              {loading
                ? "—"
                : stats.lowStockProducts}
            </strong>
          </div>

          {/* CUSTOMERS */}

          <div className="admin-stat">
            <span>
              CUSTOMERS
            </span>

            <strong>
              {loading
                ? "—"
                : stats.totalCustomers}
            </strong>
          </div>

        </div>

        {/* =====================================================
            RECENT ORDERS
        ====================================================== */}

        <div className="admin-section-head">

          <div>
            <span className="admin-eyebrow">
              LATEST ACTIVITY
            </span>

            <h2>
              RECENT ORDERS
            </h2>
          </div>

          <Link
            href="/orders"
            className="admin-view-all"
          >
            VIEW ALL
            <ArrowRight size={13} />
          </Link>

        </div>

        {loading ? (
          <div className="admin-table-wrap">
            <div
              style={{
                padding: 55,
                textAlign:
                  "center",
                color: "#999",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              LOADING DASHBOARD...
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap">

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
                    TRANSACTION ID
                  </th>

                  <th>
                    PAYMENT
                  </th>

                  <th>
                    DATE
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>

                {orders
                  .slice(0, 10)
                  .map((order) => {

                    const paymentStatus =
                      (
                        order.payment_status ??
                        "pending"
                      ).toLowerCase();

                    const displayOrderNumber =
                      order.order_number ||
                      `#${order.id
                        .slice(
                          0,
                          8
                        )
                        .toUpperCase()}`;

                    return (
                      <tr
                        key={
                          order.id
                        }
                      >

                        {/* ORDER */}

                        <td>
                          <Link
                            href={`/orders/${encodeURIComponent(
                              order.id
                            )}`}
                            className="admin-order-link"
                          >
                            {
                              displayOrderNumber
                            }
                          </Link>
                        </td>

                        {/* CUSTOMER */}

                        <td>
                          {
                            order.customer_email ??
                            "—"
                          }
                        </td>

                        {/* AMOUNT */}

                        <td>
                          {formatPrice(
                            order.total
                          )}
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
                            {
                              order.transaction_id ??
                              "—"
                            }
                          </span>
                        </td>

                        {/* PAYMENT */}

                        <td>
                          <span
                            className={`status-badge status-${paymentStatus}`}
                          >
                            {
                              paymentLabel(
                                paymentStatus
                              )
                            }
                          </span>
                        </td>

                        {/* DATE */}

                        <td>
                          {formatDate(
                            order.created_at
                          )}
                        </td>

                        {/* VIEW */}

                        <td>
                          <Link
                            href={`/orders/${encodeURIComponent(
                              order.id
                            )}`}
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: 5,
                              textDecoration:
                                "none",
                              fontSize: 7,
                              fontWeight: 900,
                              letterSpacing: 1,
                            }}
                          >
                            VIEW

                            <ArrowRight
                              size={11}
                            />
                          </Link>
                        </td>

                      </tr>
                    );
                  })}

                {orders.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 50,
                        textAlign:
                          "center",
                        color:
                          "#999",
                        fontSize:
                          9,
                        letterSpacing:
                          1.2,
                      }}
                    >
                      NO ORDERS YET.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* =====================================================
            MANAGEMENT
        ====================================================== */}

        <div className="admin-section-head">

          <div>
            <span className="admin-eyebrow">
              SYSTEM CONTROL
            </span>

            <h2>
              MANAGEMENT
            </h2>
          </div>

        </div>

        <div
          className="admin-quick-grid"
          style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns:
              "repeat(4,minmax(0,1fr))",
            gap: 12,
          }}
        >

          <QuickLink
            href="/orders"
            icon={
              <ShoppingBag size={16} />
            }
            label="MANAGE ORDERS"
          />

          <QuickLink
            href="/customers"
            icon={
              <Users size={16} />
            }
            label="CUSTOMERS"
          />

          <QuickLink
            href="/products"
            icon={
              <Package size={16} />
            }
            label="PRODUCTS"
          />

          <QuickLink
            href="/brands"
            icon={
              <span
                style={{
                  fontFamily:
                    "Georgia, serif",
                  fontSize: 18,
                  fontStyle:
                    "italic",
                }}
              >
                B
              </span>
            }
            label="BRANDS"
          />

          <QuickLink
            href="/hero"
            icon={
              <span
                style={{
                  fontFamily:
                    "Georgia, serif",
                  fontSize: 18,
                  fontStyle:
                    "italic",
                }}
              >
                H
              </span>
            }
            label="HERO MANAGER"
          />

          <QuickLink
            href="/offers"
            icon={
              <span
                style={{
                  fontFamily:
                    "Georgia, serif",
                  fontSize: 18,
                  fontStyle:
                    "italic",
                }}
              >
                O
              </span>
            }
            label="OFFERS"
          />

          <QuickLink
            href="/orders?payment=pending"
            icon={
              <Clock3 size={16} />
            }
            label="PENDING PAYMENTS"
          />

          <QuickLink
            href="/orders?payment=failed"
            icon={
              <XCircle size={16} />
            }
            label="FAILED PAYMENTS"
          />

        </div>

        {/* =====================================================
            VERIFIED ORDERS
        ====================================================== */}

        <div
          style={{
            marginTop: 12,
          }}
        >
          <QuickLink
            href="/orders?payment=paid"
            icon={
              <PackageCheck size={16} />
            }
            label="VERIFIED ORDERS"
          />
        </div>

      </main>

      <style jsx>{`

        .admin-quick-grid {
          width: 100%;
        }

        @media (max-width: 1100px) {
          .admin-stat-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              ) !important;
          }
        }

        @media (max-width: 850px) {
          .admin-quick-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              ) !important;
          }
        }

        @media (max-width: 520px) {
          .admin-stat-grid {
            grid-template-columns:
              1fr !important;
          }

          .admin-quick-grid {
            grid-template-columns:
              1fr !important;
          }
        }

      `}</style>
    </AdminShell>
  );
}

/* =========================================================
   QUICK LINK
========================================================= */

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        minHeight: 80,
        padding: 18,

        display: "flex",
        alignItems: "center",

        gap: 12,

        border:
          "1px solid #dedbd4",

        background: "#fff",

        color: "#111",

        textDecoration: "none",

        fontSize: 8,
        fontWeight: 900,
        letterSpacing: 1,

        transition:
          "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform =
          "translateY(-3px)";

        event.currentTarget.style.borderColor =
          "#111";

        event.currentTarget.style.boxShadow =
          "0 12px 30px rgba(17,17,15,0.07)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.borderColor =
          "#dedbd4";

        event.currentTarget.style.boxShadow =
          "none";
      }}
    >
      {icon}

      {label}
    </Link>
  );
}