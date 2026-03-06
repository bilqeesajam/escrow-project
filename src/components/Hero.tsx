import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import styles from "./Hero.module.css";
import { ArrowRight } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <section className={styles.hero} id="hero">
      <div className={styles.content}>
        <h1>
          Secure Transactions, <span className={styles.highlight}>Simplified.</span>
        </h1>
        <p className={styles.sub}>
          Secure escrow services for freelancers, retailers, and high-value deals.
        </p>
        <div className={styles.buttons}>
          <Link to="/auth">
            <Button variant="default" className={styles.ctaButton}>Get Started Now<ArrowRight className="h-4 w-4 ml-2" />
</Button>
          </Link>
        </div>
        <p className={styles.note}>
          Secured by <strong>PayFast</strong>
        </p>
      </div><br />
    </section>
  );
};

export default Hero;