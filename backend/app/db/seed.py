import sys
import os
from datetime import datetime, timedelta, timezone

# Add parent dir to path so script runs cleanly from anywhere
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from app.db.database import engine, Base, SessionLocal
from app.models.schema import User, HCP, Product, Interaction, Followup, ChatMessage, AgentLog

def seed_data():
    print("[Seed] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("[Seed] Database already seeded. Skipping initial population.")
            return

        print("[Seed] Seeding Medical Representative user...")
        rep = User(
            email="alex.mercer@veevacrm.health",
            full_name="Alex Mercer (Senior Sales Rep)",
            role="Lead Medical Representative"
        )
        db.add(rep)
        db.commit()
        db.refresh(rep)

        print("[Seed] Seeding Pharmaceutical Product Catalog...")
        products = [
            Product(name="MetfoPlus 500mg", category="Endocrinology / Diabetes", description="Advanced sustained-release metformin with gastrointestinal protection.", indications="Type 2 Diabetes Mellitus", dosage="500mg BD", sample_available=True),
            Product(name="CardioGuard 10mg", category="Cardiology", description="Selective beta-1 blocker with arterial vasodilation properties.", indications="Hypertension & Chronic Heart Failure", dosage="10mg OD", sample_available=True),
            Product(name="OncoShield 100mg", category="Oncology", description="Targeted kinase inhibitor for solid tumor therapy.", indications="NSCLC & Renal Cell Carcinoma", dosage="100mg OD", sample_available=False),
            Product(name="GlucoPrime XR", category="Endocrinology / Diabetes", description="SGLT2 inhibitor reducing cardiovascular mortality in diabetic patients.", indications="Type 2 Diabetes & CKD", dosage="10mg OD", sample_available=True),
            Product(name="VeloHeart 5mg", category="Cardiology", description="Next-gen ACE inhibitor combined with calcium channel blocker.", indications="Severe Hypertension", dosage="5mg OD", sample_available=True),
            Product(name="NeuroCalm 25mg", category="Neurology", description="GABAergic stabilizer for neuropathic pain and chronic migraine.", indications="Diabetic Neuropathy & Migraine", dosage="25mg HS", sample_available=True),
            Product(name="RespiraClear Inhaler", category="Pulmonology", description="Ultra-fine corticosteroid + LABA dry powder inhaler.", indications="Moderate to Severe Asthma & COPD", dosage="2 Puffs BD", sample_available=True),
            Product(name="ImmunoBoost Plus", category="Immunology", description="Biologic TNF-alpha inhibitor for rheumatoid arthritis.", indications="Rheumatoid Arthritis & Psoriasis", dosage="40mg Bi-weekly SC", sample_available=False),
            Product(name="OsteoFlex Gel", category="Orthopedics", description="High-penetration transdermal NSAID gel with menthol.", indications="Osteoarthritis Pain Relief", dosage="Topical TID", sample_available=True),
            Product(name="DermaSoothe Cream", category="Dermatology", description="Steroid-free calcineurin inhibitor topical emulsion.", indications="Atopic Dermatitis & Eczema", dosage="Apply BD", sample_available=True),
        ]
        db.add_all(products)
        db.commit()

        print("[Seed] Seeding Healthcare Professionals (HCPs)...")
        hcps = [
            HCP(name="Dr. Rajesh Sharma", hospital="Apollo Hospital", specialization="Cardiology", email="r.sharma@apollo.health", phone="+91 98111 22334", address="Sarita Vihar, New Delhi", tier="Priority A", relationship_score=92.5, risk_score=8.0, opportunity_score=95.0),
            HCP(name="Dr. Ananya Gupta", hospital="AIIMS Medical Center", specialization="Endocrinology", email="ananya.g@aiims.edu", phone="+91 98222 33445", address="Ansari Nagar East, New Delhi", tier="Priority A", relationship_score=88.0, risk_score=12.0, opportunity_score=90.0),
            HCP(name="Dr. Vikram Mehta", hospital="Fortis Healthcare", specialization="Oncology", email="v.mehta@fortis.org", phone="+91 98333 44556", address="Bannerghatta Road, Bengaluru", tier="Priority A", relationship_score=79.5, risk_score=21.0, opportunity_score=88.0),
            HCP(name="Dr. Sneha Desai", hospital="Max Super Specialty Hospital", specialization="Neurology", email="s.desai@maxhealthcare.com", phone="+91 98444 55667", address="Saket, New Delhi", tier="Priority B", relationship_score=74.0, risk_score=25.0, opportunity_score=82.0),
            HCP(name="Dr. Arvind Patel", hospital="Manipal Hospital", specialization="Cardiology", email="arvind.p@manipal.org", phone="+91 98555 66778", address="HAL Airport Road, Bengaluru", tier="Priority A", relationship_score=85.0, risk_score=15.0, opportunity_score=89.0),
            HCP(name="Dr. Priya Nair", hospital="Lilavati Hospital", specialization="Endocrinology", email="priya.nair@lilavati.org", phone="+91 98666 77889", address="Bandra West, Mumbai", tier="Priority B", relationship_score=68.0, risk_score=32.0, opportunity_score=78.0),
            HCP(name="Dr. Rohan Kulkarni", hospital="Kokilaben Dhirubhai Ambani Hospital", specialization="Orthopedics", email="r.kulkarni@kdah.org", phone="+91 98777 88990", address="Andheri West, Mumbai", tier="Priority B", relationship_score=71.5, risk_score=28.0, opportunity_score=75.0),
            HCP(name="Dr. Meenakshi Sundaram", hospital="Christian Medical College (CMC)", specialization="Immunology", email="m.sundaram@cmcvellore.edu", phone="+91 98888 99001", address="Ida Scudder Road, Vellore", tier="Priority A", relationship_score=94.0, risk_score=6.0, opportunity_score=94.0),
            HCP(name="Dr. Sameer Verma", hospital="Medanta The Medicity", specialization="Pulmonology", email="sameer.v@medanta.org", phone="+91 98999 00112", address="Sector 38, Gurugram", tier="Priority A", relationship_score=86.5, risk_score=14.0, opportunity_score=87.0),
            HCP(name="Dr. Kavita Joshi", hospital="Breach Candy Hospital", specialization="Dermatology", email="k.joshi@breachcandy.org", phone="+91 99000 11223", address="Bhulabhai Desai Road, Mumbai", tier="Priority C", relationship_score=58.0, risk_score=42.0, opportunity_score=65.0),
        ]
        db.add_all(hcps)
        db.commit()
        for h in hcps:
            db.refresh(h)

        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        y_str = (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d")
        old_str = (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")

        print("[Seed] Seeding Interaction History & AI Summaries...")
        interactions = [
            Interaction(
                hcp_id=hcps[0].id,
                user_id=rep.id,
                interaction_date=today_str,
                interaction_type="Visit",
                duration_minutes=35,
                discussion_topics="Visited Dr. Sharma today at Apollo Hospital. Discussed clinical benefits of CardioGuard 10mg vs standard carvedilol for CHF patients. Doctor showed high interest.",
                products_discussed=["CardioGuard 10mg", "VeloHeart 5mg"],
                samples_given=[{"product": "CardioGuard 10mg", "quantity": 15}, {"product": "VeloHeart 5mg", "quantity": 10}],
                follow_up_required=True,
                follow_up_date=(datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d"),
                notes="Doctor noted that recent hypertensive patients responded well to beta-1 blockade. Requested 15 trial packs and a follow-up on arterial compliance metrics next week.",
                ai_summary="Representative completed high-value clinical visit with Dr. Sharma discussing CardioGuard 10mg. Doctor expressed strong positive sentiment and accepted 25 total sample units with scheduled follow-up.",
                sentiment="Positive",
                priority="High",
                next_action="Provide arterial compliance clinical summary and deliver additional CardioGuard starter kits.",
                confidence_score=0.98,
                status="saved"
            ),
            Interaction(
                hcp_id=hcps[1].id,
                user_id=rep.id,
                interaction_date=y_str,
                interaction_type="Visit",
                duration_minutes=45,
                discussion_topics="Detailed scientific discussion on MetfoPlus 500mg and GlucoPrime XR combination in CKD patients.",
                products_discussed=["MetfoPlus 500mg", "GlucoPrime XR"],
                samples_given=[{"product": "GlucoPrime XR", "quantity": 20}],
                follow_up_required=True,
                follow_up_date=(datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"),
                notes="Dr. Gupta inquired about nephroprotective outcomes in SGLT2 clinical trials. Highly engaged throughout presentation.",
                ai_summary="In-depth scientific review of MetfoPlus and GlucoPrime XR with Dr. Gupta. Doctor requested detailed renal safety trial data and accepted 20 GlucoPrime sample packs.",
                sentiment="Positive",
                priority="High",
                next_action="Send EMPA-KIDNEY and CKD clinical trial monographs via secure medical portal.",
                confidence_score=0.97,
                status="saved"
            ),
            Interaction(
                hcp_id=hcps[2].id,
                user_id=rep.id,
                interaction_date=old_str,
                interaction_type="Conference",
                duration_minutes=25,
                discussion_topics="Met at National Oncology Summit. Brief discussion on OncoShield kinase selectivity.",
                products_discussed=["OncoShield 100mg"],
                samples_given=[],
                follow_up_required=True,
                follow_up_date=(datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d"),
                notes="Doctor raised concerns about Grade 2 diarrhea incidence observed in phase 3 trials. Needs mitigation protocol details.",
                ai_summary="Brief conference interaction with Dr. Mehta regarding OncoShield. Doctor expressed neutral sentiment with specific inquiries into adverse event management.",
                sentiment="Neutral",
                priority="Medium",
                next_action="Schedule advisory board clinical liaison meeting on toxicity management.",
                confidence_score=0.94,
                status="saved"
            ),
            Interaction(
                hcp_id=hcps[3].id,
                user_id=rep.id,
                interaction_date=old_str,
                interaction_type="Phone",
                duration_minutes=15,
                discussion_topics="Follow-up call on NeuroCalm 25mg sample efficacy in neuropathic pain.",
                products_discussed=["NeuroCalm 25mg"],
                samples_given=[],
                follow_up_required=False,
                notes="Doctor reported positive patient feedback and noticeable reduction in sleep disturbances.",
                ai_summary="Phone follow-up confirming positive clinical outcomes for NeuroCalm 25mg in neuropathic pain patients.",
                sentiment="Positive",
                priority="Medium",
                next_action="Maintain monthly touchpoint schedule.",
                confidence_score=0.96,
                status="saved"
            )
        ]
        db.add_all(interactions)
        db.commit()

        print("[Seed] Seeding Strategic Follow-up Plans & Agent Execution Logs...")
        followups = [
            Followup(
                hcp_id=hcps[0].id,
                interaction_id=interactions[0].id,
                user_id=rep.id,
                suggested_date=(datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d"),
                strategy="Reinforce arterial vasodilation superiority data of CardioGuard vs carvedilol.",
                talking_points=[
                    "Share 24-hour ambulatory blood pressure reduction trial results.",
                    "Review sample utilization across Dr. Sharma's CHF patient cohort.",
                    "Invite to upcoming Delhi Cardiology Roundtable symposium."
                ],
                status="pending",
                priority="High"
            ),
            Followup(
                hcp_id=hcps[1].id,
                interaction_id=interactions[1].id,
                user_id=rep.id,
                suggested_date=(datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"),
                strategy="Deliver comprehensive nephroprotection clinical dossier for GlucoPrime XR.",
                talking_points=[
                    "Walk through eGFR stabilization curves over 36 months.",
                    "Confirm patient access program enrollment details.",
                    "Discuss potential speaker bureau engagement for regional CME events."
                ],
                status="pending",
                priority="High"
            )
        ]
        db.add_all(followups)
        db.commit()

        print("[SUCCESS] [Seed] Database successfully populated with high-fidelity enterprise data!")
    except Exception as e:
        print(f"[ERROR] [Seed] Error populating data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
