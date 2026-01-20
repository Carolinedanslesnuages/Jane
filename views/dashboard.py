"""Dashboard page."""

from datetime import datetime, timedelta

import plotly.express as px
import streamlit as st

from charts import CATEGORY_COLORS_HEX, style
from ethogram import ETHOGRAM
from tables import format_duration
from ui import page_header


def render(db, individuals_df, selected_individual_id):
    """Render the page."""
    page_header("Tableau de bord", "Budget-temps, stress et activité sur la période choisie.")
    
    # Date range selector
    col1, col2 = st.columns(2)
    
    with col1:
        start_date = st.date_input(
            "Du",
            value=datetime.now().date() - timedelta(days=7)
        )
    
    with col2:
        end_date = st.date_input(
            "Au",
            value=datetime.now().date()
        )
    
    # Get data for the selected period
    df = db.get_observations_by_date_range(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d'),
        selected_individual_id
    )
    
    if df.empty:
        st.info("Aucune donnée sur cette période. Élargissez les dates ou enregistrez des observations.")
    else:
        # Key figures
        stress_count = int((df['category'] == 'Stress').sum())
        observed_days = df['timestamp'].dt.date.nunique()
        measured_seconds = df.loc[df['observation_type'] == 'state', 'duration_seconds'].sum()
        
        kpi1, kpi2, kpi3, kpi4 = st.columns(4)
        kpi1.metric("Observations", len(df))
        kpi2.metric("Jours observés", observed_days)
        kpi3.metric("Temps mesuré", format_duration(measured_seconds) or "0 s")
        kpi4.metric("Signes de stress", stress_count)
        
        # ====================================================================
        # TIME BUDGET ANALYSIS
        # ====================================================================
        st.subheader("Budget-temps")
        
        # Calculate time spent per category
        # For events, we count occurrences; for states, we sum durations
        time_budget = {}
        
        for category in ETHOGRAM.keys():
            category_df = df[df['category'] == category]
            
            # For state observations, sum the duration
            state_time = category_df[category_df['observation_type'] == 'state']['duration_seconds'].sum()
            
            # For event observations, we can't measure duration, but we count occurrences
            event_count = len(category_df[category_df['observation_type'] == 'event'])
            
            time_budget[category] = {
                'duration_seconds': state_time,
                'event_count': event_count
            }
        
        # Create visualizations
        col1, col2 = st.columns(2)
        
        with col1:
            # Duration-based pie chart (only for state observations)
            duration_data = {cat: data['duration_seconds'] for cat, data in time_budget.items() if data['duration_seconds'] > 0}
            
            if duration_data:
                fig_duration = px.pie(
                    values=list(duration_data.values()),
                    names=list(duration_data.keys()),
                    color=list(duration_data.keys()),
                    color_discrete_map=CATEGORY_COLORS_HEX,
                    hole=0.55
                )
                fig_duration.update_traces(textposition='outside', textinfo='percent+label')
                st.plotly_chart(style(fig_duration, "Répartition du temps mesuré"), use_container_width=True)
            else:
                st.info("Aucune donnée de durée disponible (utilisez le mode État)")
        
        with col2:
            # Event count bar chart
            event_data = {cat: data['event_count'] for cat, data in time_budget.items() if data['event_count'] > 0}
            
            if event_data:
                fig_events = px.bar(
                    x=list(event_data.keys()),
                    y=list(event_data.values()),
                    labels={'x': '', 'y': 'Événements'},
                    color=list(event_data.keys()),
                    color_discrete_map=CATEGORY_COLORS_HEX
                )
                fig_events.update_layout(showlegend=False)
                st.plotly_chart(style(fig_events, "Événements par catégorie"), use_container_width=True)
            else:
                st.info("Aucun événement enregistré")
        
        # ====================================================================
        # STRESS BEHAVIOR ANALYSIS
        # ====================================================================
        st.subheader("⚠️ Analyse des Comportements de Stress")
        
        stress_df = df[df['category'] == 'Stress'].copy()
        
        if not stress_df.empty:
            # Group by date and count occurrences
            stress_df['date'] = stress_df['timestamp'].dt.date
            stress_by_date = stress_df.groupby('date').size().reset_index(name='count')
            
            # Create line chart for stress frequency over time
            fig_stress = px.line(
                stress_by_date,
                x='date',
                y='count',
                title="Évolution de la Fréquence des Comportements de Stress",
                labels={'date': 'Date', 'count': 'Nombre de comportements'},
                markers=True
            )
            fig_stress.update_layout(xaxis_title="Date", yaxis_title="Fréquence")
            st.plotly_chart(fig_stress, use_container_width=True)
            
            # Breakdown by specific stress behaviors
            col1, col2 = st.columns(2)
            
            with col1:
                stress_by_behavior = stress_df.groupby('behavior_name').size().reset_index(name='count')
                stress_by_behavior = stress_by_behavior.sort_values('count', ascending=False)
                
                fig_stress_detail = px.bar(
                    stress_by_behavior,
                    x='behavior_name',
                    y='count',
                    title="Comportements de Stress les Plus Fréquents",
                    labels={'behavior_name': 'Comportement', 'count': 'Occurrences'},
                    color='count',
                    color_continuous_scale='Reds'
                )
                st.plotly_chart(fig_stress_detail, use_container_width=True)
            
            with col2:
                # Summary statistics
                st.markdown("**📈 Statistiques de Stress**")
                st.metric("Total de comportements de stress", len(stress_df))
                st.metric("Moyenne par jour", f"{len(stress_df) / max(1, (end_date - start_date).days + 1):.1f}")
                
                most_common = stress_by_behavior.iloc[0] if not stress_by_behavior.empty else None
                if most_common is not None:
                    st.metric("Comportement le plus fréquent", most_common['behavior_name'])
            
            # Stress correlation analysis
            st.markdown("---")
            st.markdown("**🔍 Corrélations de Stress**")
            
            # Correlation with time of day
            if 'timestamp' in stress_df.columns:
                stress_df['hour'] = stress_df['timestamp'].dt.hour
                stress_by_hour = stress_df.groupby('hour').size().reset_index(name='count')
                
                fig_hour = px.bar(stress_by_hour, x='hour', y='count',
                                title="Comportements de Stress par Heure de la Journée",
                                labels={'hour': 'Heure', 'count': 'Nombre de comportements'})
                st.plotly_chart(fig_hour, use_container_width=True)
            
            # Correlation with stimuli if available
            if 'stimuli' in stress_df.columns and stress_df['stimuli'].notna().any():
                stimuli_counts = stress_df[stress_df['stimuli'] != ''].groupby('stimuli').size().reset_index(name='count')
                if not stimuli_counts.empty:
                    fig_stimuli = px.pie(stimuli_counts, values='count', names='stimuli',
                                       title="Stress en Fonction des Stimuli")
                    st.plotly_chart(fig_stimuli, use_container_width=True)
            
            # Correlation with location if available
            if 'location' in stress_df.columns and stress_df['location'].notna().any():
                location_counts = stress_df[stress_df['location'] != ''].groupby('location').size().reset_index(name='count')
                if not location_counts.empty:
                    fig_location = px.bar(location_counts, x='location', y='count',
                                        title="Stress en Fonction du Lieu",
                                        labels={'location': 'Lieu', 'count': 'Occurrences'})
                    st.plotly_chart(fig_location, use_container_width=True)
        else:
            st.info("Aucun comportement de stress enregistré pour cette période.")
        
        st.markdown("---")
        
        # ====================================================================
        # ACTIVITY TIMELINE
        # ====================================================================
        st.subheader("📅 Chronologie d'Activité")
        
        # Group by date and category
        # A state belongs to the day it started, not the day it ended
        df['date'] = df['start_time'].fillna(df['timestamp']).dt.date
        timeline_data = df.groupby(['date', 'category']).size().reset_index(name='count')
        
        fig_timeline = px.bar(
            timeline_data,
            x='date',
            y='count',
            color='category',
            title="Activité Quotidienne par Catégorie",
            labels={'date': 'Date', 'count': 'Nombre d\'observations', 'category': 'Catégorie'},
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        st.plotly_chart(fig_timeline, use_container_width=True)
