﻿using System.IO;
using Autofac;
using MassTransit;
using SmartFleet.Core;
using SmartFleet.Core.Infrastructure.MassTransit;
using SmartFleet.Core.ReverseGeoCoding;
using TeltonikaListner;

namespace SmartFleet.TcpWorker
{
    public static class DependencyRegistrar
    {
        static IContainer Container { get; set; }
        static IContainer BuildContainer()
        {
            var builder = new ContainerBuilder();
            builder.RegisterType<ReverseGeoCodingService>();
            var bus = RabbitMqConfig.ConfigureSenderBus();
            builder.RegisterInstance(bus).As<IBusControl>();
            builder.RegisterType<TeltonikaTcpServer>();
           return builder.Build();
        }

        public static void ResolveDependencies()
        {
            Container = BuildContainer();
            Container.Resolve<ReverseGeoCodingService>();
            Container.Resolve<IBusControl>();
            var listener = Container.Resolve<TeltonikaTcpServer>();
             listener.Start();
            
        }

    }
}
