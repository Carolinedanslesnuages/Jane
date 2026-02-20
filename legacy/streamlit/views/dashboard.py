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
        st.subheader("Stress")
        
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
                labels={'date': '', 'count': 'Comportements'},
                markers=True,
                color_discrete_sequence=[CATEGORY_COLORS_HEX['Stress']]
            )
            st.plotly_chart(style(fig_stress, "Fréquence du stress par jour"), use_container_width=True)
            
            # Breakdown by specific stress behaviors
            col1, col2 = st.columns(2)
            
            with col1:
                stress_by_behavior = stress_df.groupby('behavior_name').size().reset_index(name='count')
                stress_by_behavior = stress_by_behavior.sort_values('count', ascending=False)
                
                fig_stress_detail = px.bar(
                    stress_by_behavior,
                    x='behavior_name',
                    y='count',
                    labels={'behavior_name': '', 'count': 'Occurrences'},
                    color_discrete_sequence=[CATEGORY_COLORS_HEX['Stress']]
                )
                st.plotly_chart(style(fig_stress_detail, "Signes de stress les plus fréquents"), use_container_width=True)
            
            with col2:
                # Summary statistics
                st.metric("Total", len(stress_df))
                st.metric("Moyenne par jour", f"{len(stress_df) / max(1, (end_date - start_date).days + 1):.1f}")
                
                most_common = stress_by_behavior.iloc[0] if not stress_by_behavior.empty else None
                if most_common is not None:
                    st.metric("Le plus fréquent", most_common['behavior_name'])
            
            # Context of the stress signs: time of day, stimuli, location
            with st.expander("Contextes du stress", expanded=True):
                hour_col, stimuli_col, location_col = st.columns(3)
                stress_color = CATEGORY_COLORS_HEX['Stress']
                
                stress_df['hour'] = stress_df['timestamp'].dt.hour
                stress_by_hour = stress_df.groupby('hour').size().reset_index(name='count')
                fig_hour = px.bar(stress_by_hour, x='hour', y='count',
                                labels={'hour': 'Heure', 'count': 'Comportements'},
                                color_discrete_sequence=[stress_color])
                hour_col.plotly_chart(style(fig_hour, "Par heure"), use_container_width=True)
                
                stimuli_counts = stress_df[stress_df['stimuli'].fillna('') != ''].groupby('stimuli').size().reset_index(name='count')
                if not stimuli_counts.empty:
                    fig_stimuli = px.bar(stimuli_counts, x='stimuli', y='count',
                                       labels={'stimuli': '', 'count': 'Occurrences'},
                                       color_discrete_sequence=[stress_color])
                    stimuli_col.plotly_chart(style(fig_stimuli, "Par stimulus"), use_container_width=True)
                else:
                    stimuli_col.caption("Aucun stimulus renseigné.")
                
                location_counts = stress_df[stress_df['location'].fillna('') != ''].groupby('location').size().reset_index(name='count')
                if not location_counts.empty:
                    fig_location = px.bar(location_counts, x='location', y='count',
                                        labels={'location': '', 'count': 'Occurrences'},
                                        color_discrete_sequence=[stress_color])
                    location_col.plotly_chart(style(fig_location, "Par lieu"), use_container_width=True)
                else:
                    location_col.caption("Aucun lieu renseigné.")
        else:
            st.info("Aucun comportement de stress enregistré pour cette période.")
        
        # ====================================================================
        # ACTIVITY TIMELINE
        # ====================================================================
        st.subheader("Activité quotidienne")
        
        # Group by date and category
        # A state belongs to the day it started, not the day it ended
        df['date'] = df['start_time'].fillna(df['timestamp']).dt.date
        timeline_data = df.groupby(['date', 'category']).size().reset_index(name='count')
        
        fig_timeline = px.bar(
            timeline_data,
            x='date',
            y='count',
            color='category',
            labels={'date': '', 'count': 'Observations', 'category': 'Catégorie'},
            color_discrete_map=CATEGORY_COLORS_HEX
        )
        st.plotly_chart(style(fig_timeline, "Observations par jour et par catégorie"), use_container_width=True)
