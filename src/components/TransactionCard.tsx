import { Link } from "react-router-dom";
import StatusBadge, { type TransactionStatus } from "@/components/StatusBadge";
import { ArrowRight, Calendar, Banknote } from "lucide-react";

export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  buyer: string;
  seller: string;
  deliveryDate: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <Link
      to={`/transactions/${transaction.id}`}
      className="block bg-card border border-border rounded-lg p-5 hover:shadow-md transition-all hover:border-accent/30 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate group-hover:text-accent transition-colors">
            {transaction.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{transaction.description}</p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Banknote className="w-3.5 h-3.5" />
          R{transaction.amount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {transaction.createdAt}
        </span>
        <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
      </div>
    </Link>
  );
};

export default TransactionCard;
