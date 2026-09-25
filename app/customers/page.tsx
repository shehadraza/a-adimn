"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  user_id?: string | null;

  customer_email?: string | null;
  customer_name?: string | null;

  shipping_name?: string | null;
  shipping_phone?: string | null;

  total?: number | null;

  created_at?: string | null;
};

type Customer = {
  key: string;

  user_id?: string | null;

  name: string;
  email: string;
  phone: string;

  orders: number;
  spent: number;

  latestOrderId: string | null;
  latestOrderNumber?: string | null;
  latestDate: string | null;
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

export default function CustomersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const loadCustomers = async () => {
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
          "ADMIN CUSTOMERS ERROR:",
          queryError
        );

        setError(
          queryError.message ||
            "Unable to load customers."
        );

        setOrders([]);
        return;
      }
setOrders(
  (data ?? []) as unknown as Order[]
);
    } catch (err) {
      console.error(
        "LOAD CUSTOMERS ERROR:",
        err
      );

      setOrders([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();

    const channel =
      supabase
        .channel(
          "admin-customers-page"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            loadCustomers();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  const customers = useMemo(() => {
    const map =
      new Map<string, Customer>();

    for (const order of orders) {
      const email =
        order.customer_email
          ?.trim()
          .toLowerCase();

      const userId =
        order.user_id?.trim();

      const key =
        email ||
        userId ||
        order.id;

      const name =
        order.customer_name ||
        order.shipping_name ||
        "Customer";

      const phone =
        order.shipping_phone ||
        "—";

      const total =
        Number(order.total) || 0;

      const existing =
        map.get(key);

      if (!existing) {
        map.set(key, {
          key,

          user_id:
            order.user_id ??
            null,

          name,
          email:
            email || "—",
          phone,

          orders: 1,
          spent: total,

          latestOrderId:
            order.id,

          latestDate:
            order.created_at ??
            null,
        });

        continue;
      }

      existing.orders += 1;
      existing.spent += total;

      if (
        !existing.phone ||
        existing.phone === "—"
      ) {
        existing.phone =
          phone;
      }

      if (
        existing.name ===
          "Customer" &&
        name !== "Customer"
      ) {
        existing.name =
          name;
      }
    }

    return Array.from(
      map.values()
    );
  }, [orders]);

  const filteredCustomers =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return customers;
      }

      return customers.filter(
        (customer) => {
          const searchable = [
            customer.name,
            customer.email,
            customer.phone,
            customer.user_id,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      customers,
      search,
    ]);

  const stats =
    useMemo(() => {
      const totalCustomers =
        customers.length;

      const totalOrders =
        customers.reduce(
          (sum, customer) =>
            sum + customer.orders,
          0
        );

      const totalSpent =
        customers.reduce(
          (sum, customer) =>
            sum + customer.spent,
          0
        );

      const repeatCustomers =
        customers.filter(
          (customer) =>
            customer.orders > 1
        ).length;

      return {
        totalCustomers,
        totalOrders,
        totalSpent,
        repeatCustomers,
      };
    }, [customers]);

  return (
    <AdminShell>
      <main className="admin-page">

        {/* HEADER */}

        <div className="customers-header">
          <div>
            <span className="admin-eyebrow">
              A-POSITIVE / CUSTOMERS
            </span>

            <h1 className="admin-title">
              CUSTOMER
              <br />
              <em>MANAGEMENT.</em>
            </h1>

            <p className="admin-subtitle">
              View customer activity,
              order history, purchase
              totals and contact details
              from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
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
          className="customer-stats"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,minmax(0,1fr))",
            gap: 10,
            marginTop: 35,
          }}
        >
          <CustomerStat
            label="CUSTOMERS"
            value={
              stats.totalCustomers
            }
            icon={
              <Users size={15} />
            }
          />

          <CustomerStat
            label="ORDERS"
            value={
              stats.totalOrders
            }
            icon={
              <ShoppingBag
                size={15}
              />
            }
          />

          <CustomerStat
            label="TOTAL SPENT"
            value={formatPrice(
              stats.totalSpent
            )}
            icon={
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                }}
              >
                ৳
              </span>
            }
          />

          <CustomerStat
            label="REPEAT CUSTOMERS"
            value={
              stats.repeatCustomers
            }
            icon={
              <Users size={15} />
            }
          />
        </div>

        {/* SEARCH */}

        <div
          style={{
            marginTop: 30,
            display: "flex",
            gap: 12,
            alignItems:
              "center",
            flexWrap: "wrap",
          }}
        >
          <div
            className="customers-search"
            style={{
              flex: 1,
              minWidth: 240,
              display: "flex",
              alignItems:
                "center",
              gap: 9,
              border:
                "1px solid #dedbd4",
              background: "#fff",
              padding:
                "0 13px",
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
              placeholder="Search customer, email, phone or user ID..."
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

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="customer-reset"
            >
              CLEAR
            </button>
          )}
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
          {filteredCustomers.length}{" "}
          OF{" "}
          {customers.length}{" "}
          CUSTOMERS
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
                textAlign:
                  "center",
                color: "#999",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              LOADING CUSTOMERS...
            </div>
          ) : (
            <table className="admin-table">

              <thead>
                <tr>
                  <th>
                    CUSTOMER
                  </th>

                  <th>
                    CONTACT
                  </th>

                  <th>
                    ORDERS
                  </th>

                  <th>
                    TOTAL SPENT
                  </th>

                  <th>
                    LATEST ORDER
                  </th>

                  <th>
                    LAST ACTIVE
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => {
                    return (
                      <tr
                        key={
                          customer.key
                        }
                      >
                        {/* CUSTOMER */}

                        <td>
                          <div>
                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize: 11,
                                fontWeight:
                                  800,
                              }}
                            >
                              {
                                customer.name
                              }
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
                              {customer.email}
                            </span>
                          </div>
                        </td>

                        {/* CONTACT */}

                        <td>
                          <span
                            style={{
                              fontSize: 9,
                              color:
                                "#555",
                            }}
                          >
                            {
                              customer.phone
                            }
                          </span>
                        </td>

                        {/* ORDERS */}

                        <td>
                          <span className="customer-number">
                            {
                              customer.orders
                            }
                          </span>
                        </td>

                        {/* SPENT */}

                        <td>
                          <strong
                            style={{
                              fontSize: 11,
                            }}
                          >
                            {formatPrice(
                              customer.spent
                            )}
                          </strong>
                        </td>

                        {/* LATEST ORDER */}

                        <td>
                          {customer.latestOrderId ? (
                            <Link
                              href={`/orders/${encodeURIComponent(
                                customer.latestOrderId
                              )}`}
                              className="customer-order-link"
                            >
                              VIEW ORDER
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* LAST ACTIVE */}

                        <td>
                          <span
                            style={{
                              fontSize: 9,
                              color:
                                "#777",
                            }}
                          >
                            {formatDate(
                              customer.latestDate
                            )}
                          </span>
                        </td>

                        {/* VIEW */}

                        <td>
                          {customer.latestOrderId ? (
                            <Link
                              href={`/orders/${encodeURIComponent(
                                customer.latestOrderId
                              )}`}
                              className="customer-view"
                            >
                              <Eye
                                size={13}
                              />
                              VIEW
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}

                {!loading &&
                  filteredCustomers.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 70,
                          textAlign:
                            "center",
                          color:
                            "#999",
                          fontSize: 9,
                          letterSpacing:
                            1.2,
                        }}
                      >
                        NO CUSTOMERS FOUND.
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
        .customers-header {
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

        .customer-reset {
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

        .customer-reset:hover {
          opacity: 0.85;
        }

        .customer-number {
          display: inline-flex;
          min-width: 28px;
          min-height: 28px;
          align-items: center;
          justify-content: center;
          background: #f4f2ed;
          color: #111;
          font-size: 10px;
          font-weight: 900;
        }

        .customer-order-link {
          color: #111;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .customer-order-link:hover {
          opacity: 0.55;
        }

        .customer-view {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #111;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.8px;
        }

        .customer-view:hover {
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

        @media (max-width: 1000px) {
          .customer-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              ) !important;
          }
        }

        @media (max-width: 800px) {
          .customers-header {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .admin-table-wrap {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 900px;
          }
        }

        @media (max-width: 520px) {
          .customer-stats {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>
    </AdminShell>
  );
}

function CustomerStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="admin-stat">
      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: 10,
        }}
      >
        <span>{label}</span>

        <span
          style={{
            color: "#999",
          }}
        >
          {icon}
        </span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}